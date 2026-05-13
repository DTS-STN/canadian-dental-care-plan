const ns = {
  index: {
    pageTitle: "Connexion factice",
    sin: "Numéro d'assurance sociale (NAS)",
    destination: "Page de destination",
    raoidc: "Revendications du jeton d'identité RAOIDC",
    sid: "Identifiant de session (sid)",
    sub: "Identifiant du sujet (sub)",
    login: "Connexion",
    errorMessage: {
      sinRequired: "Entrez un NAS",
      sinInvalid: "Entrez un NAS valide",
      destinationRequired: "Sélectionnez une page de destination",
      sidRequired: "Entrez un sid",
      subRequired: "Entrez un sub",
    },
  },
} as const;

export default ns;
