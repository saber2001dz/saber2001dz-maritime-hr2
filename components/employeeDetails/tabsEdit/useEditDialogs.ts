"use client"
import { useState } from "react"

// Hook personnalisé pour utiliser les dialogs depuis le composant parent
export function useEditDialogs() {
  const [activeDialog, setActiveDialog] = useState<string | null>(null)

  const openContractDialog = () => setActiveDialog("contract")
  const openSituationDialog = () => setActiveDialog("situation")
  const openGradesListDialog = () => setActiveDialog("gradesList")
  const openFonctionsListDialog = () => setActiveDialog("fonctionsList")
  const openAffectationDialog = () => setActiveDialog("affectation")
  const openBanqueDialog = () => setActiveDialog("banque")
  const openAbsencesListDialog = () => setActiveDialog("absencesList")
  const openProlongationDialog = () => setActiveDialog("prolongation")
  const closeDialog = () => setActiveDialog(null)

  return {
    activeDialog,
    openContractDialog,
    openSituationDialog,
    openGradesListDialog,
    openFonctionsListDialog,
    openAffectationDialog,
    openBanqueDialog,
    openAbsencesListDialog,
    openProlongationDialog,
    closeDialog,
  }
}