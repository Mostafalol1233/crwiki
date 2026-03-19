module.exports = {
  apps: [
    {
      name: "crossfire-backend",
      script: "server.js",
      instances: "max",
      exec_mode: "cluster",
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: process.env.PORT || 8080,
        CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "dkpdidm89",
        CLOUDINARY_UPLOAD_PRESET: process.env.CLOUDINARY_UPLOAD_PRESET || "crossfire",
        CLOUDINARY_RESOURCE_TYPE: process.env.CLOUDINARY_RESOURCE_TYPE || "auto",
        CORS_ORIGIN: process.env.CORS_ORIGIN || "*",
        MONGO_URL: process.env.MONGO_URL || ""
      },
      max_memory_restart: "300M",
      out_file: "./logs/out.log",
      error_file: "./logs/error.log",
      merge_logs: true,
      time: true
    }
  ]
};

