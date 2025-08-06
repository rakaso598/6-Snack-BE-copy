import swaggerJSDoc from "swagger-jsdoc";

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Snack API",
    version: "1.0.0",
    description: "원스톱 간식 구매 솔루션 Snack API 문서에 오신 걸 환영합니다.",
  },
  servers: [
    {
      url: "http://localhost:8080",
      description: "Development server",
    },
    {
      url: "https://api.5nack.site",
      description: "Production server",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
};

const options = {
  swaggerDefinition,
  apis: ["./src/routes/*.ts", "./src/controllers/*.ts"],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
