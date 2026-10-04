const fs = require("fs");
const path = require("path");
const User = require("../models/User");
const Attendance = require("../models/Attendance");
const { getIsConnected } = require("./db");

const dataDir = path.join(__dirname, "..", "data");
const usersFile = path.join(dataDir, "users.json");
const attendanceFile = path.join(dataDir, "attendance.json");

// Ensure data directory and fallback files exist
function initLocalFiles() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(attendanceFile)) {
    fs.writeFileSync(attendanceFile, JSON.stringify([], null, 2));
  }
}

initLocalFiles();

const readLocal = (file) => {
  try {
    const raw = fs.readFileSync(file, "utf8");
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
};

const writeLocal = (file, data) => {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(`Error saving to ${file}:`, e);
  }
};

// Data Store API
const dataStore = {
  // === USER OPERATIONS ===
  async getUsers() {
    if (getIsConnected()) {
      return await User.find().sort({ createdAt: -1 });
    }
    return readLocal(usersFile);
  },

  async getUserById(id) {
    if (getIsConnected()) {
      return await User.findById(id);
    }
    const users = readLocal(usersFile);
    return users.find((u) => u._id === id || u.id === id);
  },

  async getUserByEmail(email) {
    if (getIsConnected()) {
      return await User.findOne({ email: email.toLowerCase() });
    }
    const users = readLocal(usersFile);
    return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  },

  async createUser(userData) {
    if (getIsConnected()) {
      const user = new User(userData);
      return await user.save();
    }
    const users = readLocal(usersFile);
    const existing = users.find(
      (u) => u.email.toLowerCase() === userData.email.toLowerCase()
    );
    if (existing) {
      const err = new Error("User with this email already exists");
      err.code = 11000;
      throw err;
    }
    const newUser = {
      _id: "usr_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
      ...userData,
      createdAt: new Date().toISOString()
    };
    users.unshift(newUser);
    writeLocal(usersFile, users);
    return newUser;
  },

  async deleteUser(id) {
    if (getIsConnected()) {
      return await User.findByIdAndDelete(id);
    }
    const users = readLocal(usersFile);
    const filtered = users.filter((u) => u._id !== id && u.id !== id);
    writeLocal(usersFile, filtered);
    return { success: true };
  },

  // === ATTENDANCE OPERATIONS ===
  async getAttendance(filter = {}) {
    if (getIsConnected()) {
      const query = {};
      if (filter.date) query.date = filter.date;
      if (filter.userName) query.userName = new RegExp(filter.userName, "i");
      return await Attendance.find(query).sort({ timestamp: -1 }).limit(filter.limit || 100);
    }
    let logs = readLocal(attendanceFile);
    if (filter.date) {
      logs = logs.filter((l) => l.date === filter.date);
    }
    if (filter.userName) {
      logs = logs.filter((l) =>
        l.userName.toLowerCase().includes(filter.userName.toLowerCase())
      );
    }
    return logs.slice(0, filter.limit || 100);
  },

  async createAttendance(logData) {
    if (getIsConnected()) {
      const log = new Attendance(logData);
      return await log.save();
    }
    const logs = readLocal(attendanceFile);
    const newLog = {
      _id: "log_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
      ...logData,
      timestamp: new Date().toISOString()
    };
    logs.unshift(newLog);
    writeLocal(attendanceFile, logs);
    return newLog;
  },

  async getStats() {
    const today = new Date().toISOString().split("T")[0];
    let totalUsers = 0;
    let todayLogs = 0;
    let totalLogs = 0;

    if (getIsConnected()) {
      totalUsers = await User.countDocuments();
      todayLogs = await Attendance.countDocuments({ date: today });
      totalLogs = await Attendance.countDocuments();
    } else {
      const users = readLocal(usersFile);
      const logs = readLocal(attendanceFile);
      totalUsers = users.length;
      todayLogs = logs.filter((l) => l.date === today).length;
      totalLogs = logs.length;
    }

    return { totalUsers, todayLogs, totalLogs, today };
  }
};

module.exports = dataStore;
