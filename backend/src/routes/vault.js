const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const { listVault, addVaultItem, updateVaultItem, removeVaultItem } = require("../controllers/vaultController");

router.get("/", requireAuth, listVault);
router.post("/items", requireAuth, addVaultItem);
router.patch("/items/:id", requireAuth, updateVaultItem);
router.delete("/items/:id", requireAuth, removeVaultItem);

module.exports = router;
