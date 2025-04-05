module.exports = {
    apps: [
      {
        name: "bot",
        script: "bot.js",
        watch: true,
        autorestart: true,
        max_memory_restart: "500M",
      },
    ],
  };
  