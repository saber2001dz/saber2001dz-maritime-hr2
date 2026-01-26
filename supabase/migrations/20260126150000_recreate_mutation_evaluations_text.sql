-- Migration pour créer la nouvelle table mutation_evaluations avec des valeurs texte
-- et supprimer l'ancienne table mutation_evaluation

-- 1. Créer la nouvelle table mutation_evaluations avec des colonnes TEXT
CREATE TABLE IF NOT EXISTS public.mutation_evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  mutation_id UUID NOT NULL,
  attention_au_travail TEXT NULL,
  discipline TEXT NULL,
  confidentialite TEXT NULL,
  apparence TEXT NULL,
  respecter_horaire TEXT NULL,
  comportement TEXT NULL,
  motivation_travail TEXT NULL,
  adaptation_collegues TEXT NULL,
  communication TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),

  CONSTRAINT mutation_evaluations_pkey PRIMARY KEY (id),
  CONSTRAINT unique_mutation_evaluations UNIQUE (mutation_id),
  CONSTRAINT mutation_evaluations_mutation_id_fkey FOREIGN KEY (mutation_id)
    REFERENCES employee_mutations (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- 2. Créer un index sur mutation_id pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_mutation_evaluations_mutation_id
  ON public.mutation_evaluations USING btree (mutation_id) TABLESPACE pg_default;

-- 3. Créer une fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_mutation_evaluations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Créer le trigger pour updated_at
CREATE TRIGGER trigger_update_mutation_evaluations_updated_at
  BEFORE UPDATE ON mutation_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION update_mutation_evaluations_updated_at();

-- 5. Supprimer l'ancienne table mutation_evaluation et ses dépendances
DROP TRIGGER IF EXISTS trigger_update_mutation_evaluation_updated_at ON mutation_evaluation;
DROP FUNCTION IF EXISTS update_mutation_evaluation_updated_at();
DROP TABLE IF EXISTS public.mutation_evaluation CASCADE;

-- 6. Commenter la table et les colonnes
COMMENT ON TABLE public.mutation_evaluations IS 'Table des évaluations pour les demandes de mutation';
COMMENT ON COLUMN public.mutation_evaluations.mutation_id IS 'Référence vers la demande de mutation';
COMMENT ON COLUMN public.mutation_evaluations.attention_au_travail IS 'الإهتمام بالعمل - Attention au travail';
COMMENT ON COLUMN public.mutation_evaluations.discipline IS 'الإنضبـــاط - Discipline';
COMMENT ON COLUMN public.mutation_evaluations.confidentialite IS 'المحافظة على السر المهني - Confidentialité';
COMMENT ON COLUMN public.mutation_evaluations.apparence IS 'العناية بالمظهر العام - Apparence';
COMMENT ON COLUMN public.mutation_evaluations.respecter_horaire IS 'إحترام توقيت الحضور - Respect des horaires';
COMMENT ON COLUMN public.mutation_evaluations.comportement IS 'السيرة و السلوك - Comportement';
COMMENT ON COLUMN public.mutation_evaluations.motivation_travail IS 'الدافهية للعمل - Motivation au travail';
COMMENT ON COLUMN public.mutation_evaluations.adaptation_collegues IS 'التكيف مع المجموعة - Adaptation avec les collègues';
COMMENT ON COLUMN public.mutation_evaluations.communication IS 'التواصل مع المواطنين - Communication';
