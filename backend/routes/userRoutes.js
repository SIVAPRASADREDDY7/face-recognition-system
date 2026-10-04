const express = require("express");
const router = express.Router();
const dataStore = require("../config/dataStore");

// GET /api/users - Get all registered users (including descriptors for face matching)
router.get("/", async (req, res) => {
  try {
    const users = await dataStore.getUsers();
    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message
    });
  }
});

// GET /api/users/:id - Get single user
router.get("/:id", async (req, res) => {
  try {
    const user = await dataStore.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching user",
      error: error.message
    });
  }
});

// POST /api/users/register - Register new user with face descriptor
router.post("/register", async (req, res) => {
  try {
    const { name, email, role, department, descriptors, photo } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Name and email are required fields"
      });
    }

    if (!descriptors || !Array.isArray(descriptors) || descriptors.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one valid face descriptor vector is required"
      });
    }

    // Check if email already registered
    const existing = await dataStore.getUserByEmail(email);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `User with email '${email}' is already registered`
      });
    }

    const newUser = await dataStore.createUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: role || "Member",
      department: department || "General",
      descriptors,
      photo: photo || ""
    });

    res.status(201).json({
      success: true,
      message: `Face enrolled successfully for ${newUser.name}!`,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
        createdAt: newUser.createdAt
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to register face"
    });
  }
});

// DELETE /api/users/:id - Delete registered user
router.delete("/:id", async (req, res) => {
  try {
    await dataStore.deleteUser(req.params.id);
    res.json({
      success: true,
      message: "User deleted successfully"
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
      error: error.message
    });
  }
});

module.exports = router;
