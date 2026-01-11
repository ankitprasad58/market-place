module.exports = {
  apps: [
    {
      name: "presets-backend",
      script: "./server.js",
      env: {
        NODE_ENV: "production",
        PORT: 5000,
      },
    },
  ],
};
