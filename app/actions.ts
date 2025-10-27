// app/actions.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { agentSchema } from '@/lib/schemas';

export async function createAgentAction(_prevState: unknown, formData: FormData) {
  // Créer le client Supabase
  const supabase = await createClient();

  // Convertir FormData en objet
  const formObject = Object.fromEntries(formData.entries());
  const isPrivate = formObject.isPrivate === 'on';

  // Valider les données avec Zod
  const validatedFields = agentSchema.safeParse({
    ...formObject,
    isPrivate,
    photo: formData.get('photo') instanceof File ? formData.get('photo') : undefined
  });

  // Gestion des erreurs de validation
  if (!validatedFields.success) {
    return {
      type: 'error',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  // Extraire les données validées
  const { photo, ...dbData } = validatedFields.data;
  let photoUrl: string | null = null;

  // Upload de la photo si elle existe
  if (photo && photo.size > 0) {
    try {
      const photoName = `${crypto.randomUUID()}-${photo.name}`;
      
      // Upload vers Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars-employees')
        .upload(photoName, photo);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return { type: 'error', message: "Erreur lors de l'upload de l'image." };
      }

      // Obtenir l'URL publique
      const { data: publicUrlData } = supabase.storage
        .from('avatars-employees')
        .getPublicUrl(uploadData.path);

      photoUrl = publicUrlData.publicUrl;
    } catch (error) {
      console.error('Photo upload failed:', error);
      return { type: 'error', message: "Erreur lors du traitement de l'image." };
    }
  }

  try {
    // Appel à la fonction RPC PostgreSQL
    const { error: rpcError } = await supabase.rpc("create_new_employee", {
      // Données obligatoires
      prenom_in: dbData.prenom || '',
      nom_in: dbData.nom || '',
      matricule_in: dbData.matricule || '',
      date_naissance_in: dbData.dateNaissance || null,
      sexe_in: dbData.sexe || '',
      grade_in: null,
      
      // Données optionnelles
      lieu_naissance_in: dbData.lieuNaissance || null,
      prenom_pere_in: dbData.prenomPere || null,
      prenom_grand_pere_in: dbData.prenomGrandPere || null,
      mere_in: dbData.mere || null,
      identifiant_unique_in: dbData.identifiantUnique || null,
      matricule_mutuel_in: dbData.matriculemutuel || null,
      etat_civil_in: null,
      prive_in: dbData.isPrivate || false,
      email_in: dbData.emailPersonnel || null,
      phone_1_in: dbData.telephoneMobile || null,
      phone_2_in: dbData.telephoneMobile || null,
      adresse_in: dbData.adresse || null,
      gouvernorat_in: dbData.gouvernorat || null,
      adresse_actuelle_in: null, // Pas dans le formulaire actuel
      gouvernorat_actuel_in: null, // Pas dans le formulaire actuel
      whatsapp_in: dbData.whatsapp || null,
      travail_conjoint_in: dbData.travailConjoint || null,
      date_recrutement_in: dbData.dateRecrutement || null,
      unite_in: null,
      fonction_admin_in: null,
      responsabilite_in: null,
      passeport_in: dbData.passeport || null,
      cin_in: dbData.cin || null,      
      photo_url_in: photoUrl || null,
    });

   if (rpcError) {
      console.error('RPC Error', rpcError);
      
      // Conservez votre gestion d'erreur existante
      if (rpcError.message.includes('Le matricule') || 
          rpcError.message.includes('employees_matricule_key')) {
        return { 
          type: 'error', 
          message: 'Ce matricule existe déjà. Veuillez utiliser un matricule unique.' 
        };
      }
      
     return { 
        type: 'error', 
        message: `Erreur base de données: ${rpcError.message}` 
      };
    }

    // SUCCÈS : retournez un état de succès sans rediriger
    return {
      type: 'success',
      message: 'Agent créé avec succès',
      redirect: '/dashboard/employees/table' // Ajoutez cette propriété
    };
    
  } catch (error) {
    // Gestion spéciale de la redirection
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
      return {
        type: 'success',
        message: 'Agent créé avec succès',
        redirect: '/dashboard/employees/table'
      };
    }
    
    console.error('Unexpected error:', error);
    return { 
      type: 'error', 
      message: 'Une erreur inattendue est survenue.' 
    };
  }
}