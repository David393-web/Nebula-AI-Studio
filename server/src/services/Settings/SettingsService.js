const prisma = require("../../utils/prisma");

const getSettings = async (userId) => {
  let settings = await prisma.settings.findUnique({
    where: {
      userId,
    },
  });

  // Create default settings if the user doesn't have any
  if (!settings) {
    settings = await prisma.settings.create({
      data: {
        userId,
      },
    });
  }

  return settings;
};

const updateSettings = async (userId, data) => {
  const settings = await prisma.settings.upsert({
    where: {
      userId,
    },
    update: data,
    create: {
      userId,
      ...data,
    },
  });

  return settings;
};

const resetSettings = async (userId) => {
  return prisma.settings.upsert({
    where: {
      userId,
    },
    update: {
      theme: "dark",
      emailNotifications: true,
      pushNotifications: true,
    },
    create: {
      userId,
      theme: "dark",
      emailNotifications: true,
      pushNotifications: true,
    },
  });
};

module.exports = {
  getSettings,
  updateSettings,
  resetSettings,
};