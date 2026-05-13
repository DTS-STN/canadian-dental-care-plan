const ns = {
  index: {
    pageTitle: "Stub Login",
    sin: "Social Insurance Number (SIN)",
    destination: "Destination Page",
    raoidc: "RAOIDC's ID Token Claims",
    sid: "Session Identifier (sid)",
    sub: "Subject Identifier (sub)",
    login: "Login",
    errorMessage: {
      sinRequired: "Enter a SIN",
      sinInvalid: "Enter a valid SIN",
      destinationRequired: "Select a destination page",
      sidRequired: "Enter a sid",
      subRequired: "Enter a sub",
    },
  },
} as const;

export default ns;
