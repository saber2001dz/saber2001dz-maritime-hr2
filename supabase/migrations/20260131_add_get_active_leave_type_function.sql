-- Fonction pour obtenir le type de congé actif d'un employé
CREATE OR REPLACE FUNCTION get_active_leave_type(employee_id_param UUID)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  active_leave_type TEXT;
BEGIN
  -- Trouver le type de congé actif (dont la date de fin est >= aujourd'hui et statut != 'Refusé')
  SELECT type_conge
  INTO active_leave_type
  FROM employee_conges
  WHERE employee_id = employee_id_param
    AND date_fin >= CURRENT_DATE
    AND statut != 'Refusé'
  ORDER BY date_fin ASC
  LIMIT 1;

  RETURN active_leave_type;
END;
$$;

-- Ajouter un commentaire sur la fonction
COMMENT ON FUNCTION get_active_leave_type(UUID) IS 'Retourne le type de congé actif pour un employé donné';
