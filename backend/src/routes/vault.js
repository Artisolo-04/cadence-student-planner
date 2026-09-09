const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const { vaultDocUpload } = require("../middleware/upload");
const {
  listVault,
  addVaultItem,
  updateVaultItem,
  removeVaultItem,
  removeVaultFolder,
  uploadDocument,
} = require("../controllers/vaultController");

router.get("/", requireAuth, listVault);
router.post("/items", requireAuth, addVaultItem);
router.patch("/items/:id", requireAuth, updateVaultItem);
router.delete("/items/:id", requireAuth, removeVaultItem);
router.delete("/folders/:name", requireAuth, removeVaultFolder);

router.post("/upload", requireAuth, (req, res, next) => {
  vaultDocUpload(req, res, (err) => {
    if (err) {
      const message =
        err.code === "LIMIT_FILE_SIZE"
          ? "File exceeds 5MB limit"
          : err.message || "Upload failed";
      return res.status(400).json({ error: message });
    }
    next();
  });
}, uploadDocument);

module.exports = router;
