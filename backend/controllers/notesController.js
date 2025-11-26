const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

exports.createNote = async (req, res) => {
  const { encryptedContent, iv, expiryMinutes, viewOnce } = req.body;
  const userId = req.user.userId;

  if (!encryptedContent || !iv || !expiryMinutes) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const noteId = uuidv4();
  const expiryDate = new Date(Date.now() + expiryMinutes * 60000);
  try {
    await pool.query(
      "INSERT INTO Notes (NoteID, UserID, EncryptedContent, IV, CreatedAt, ExpiryTime, ViewOnce) VALUES (?, ?, ?, ?, NOW(), ?, ?)",
      [noteId, userId, encryptedContent, iv, expiryDate, viewOnce ? 1 : 0]
    );
    res.status(201).json({ noteId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getNote = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query("SELECT * FROM Notes WHERE NoteID=? AND IsDeleted=FALSE", [id]);
    if (rows.length === 0) return res.status(404).json({ error: "Note not found or deleted" });
    const note = rows[0];
    if (new Date() > note.ExpiryTime) return res.status(410).json({ error: "Note expired" });

    res.json({
      encryptedContent: note.EncryptedContent,
      iv: note.IV,
      viewOnce: note.ViewOnce,
      expiryTime: note.ExpiryTime,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteNote = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("UPDATE Notes SET IsDeleted=TRUE WHERE NoteID=?", [id]);
    res.json({ message: "Note deleted (self-destructed)" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
