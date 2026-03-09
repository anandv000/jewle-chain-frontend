import React, { useState, useRef } from "react";
import { theme, ALLOWED_IMAGE_TYPES } from "../theme";
import { folderAPI } from "../services/api";
import Icon   from "../components/Icon";
import Modal  from "../components/Modal";
import Field  from "../components/Field";

const folderIcons = { Ring: "ring", Necklace: "gold", Earrings: "gold", Bracelet: "gold" };

const Products = ({ folders, setFolders }) => {
  const [showAddFolder,  setShowAddFolder]  = useState(false);
  const [newFolderName,  setNewFolderName]  = useState("");
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [showAddItem,    setShowAddItem]    = useState(false);
  const [itemForm,       setItemForm]       = useState({ name: "", weight: "", desc: "", imagePreview: null, imageFile: null });
  const [itemErrors,     setItemErrors]     = useState({});
  const [saving,         setSaving]         = useState(false);
  const imgRef = useRef();

  // ── Add new folder ──────────────────────────────────────────────────────────
  const addFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const res = await folderAPI.create({ name: newFolderName.trim() });
      setFolders((prev) => [...prev, res.data.data]);
      setNewFolderName("");
      setShowAddFolder(false);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to create folder.");
    }
  };

  // ── Remove folder ───────────────────────────────────────────────────────────
  const removeFolder = async (idx, e) => {
    e.stopPropagation();
    if (!window.confirm(`Remove folder "${folders[idx].name}"? All items will be deleted.`)) return;
    try {
      await folderAPI.remove(folders[idx]._id);
      setFolders((prev) => prev.filter((_, i) => i !== idx));
      if (selectedFolder === idx) setSelectedFolder(null);
      else if (selectedFolder > idx) setSelectedFolder((s) => s - 1);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete folder.");
    }
  };

  // ── Handle image file selection ─────────────────────────────────────────────
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setItemErrors((prev) => ({ ...prev, image: "Only JPG, JPEG, PNG, AVIF files are allowed." }));
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) =>
      setItemForm((f) => ({ ...f, imagePreview: ev.target.result, imageFile: file }));
    reader.readAsDataURL(file);
    setItemErrors((prev) => ({ ...prev, image: null }));
  };

  // ── Open add item modal ─────────────────────────────────────────────────────
  const openAddItem = () => {
    setItemForm({ name: "", weight: "", desc: "", imagePreview: null, imageFile: null });
    setItemErrors({});
    setShowAddItem(true);
  };

  // ── Validate item before saving ─────────────────────────────────────────────
  const validateItem = () => {
    const errs = {};
    if (!itemForm.name.trim()) {
      errs.name = "Item name is required.";
    } else {
      const isDupe = folders[selectedFolder].items.some(
        (it) => it.name.trim().toLowerCase() === itemForm.name.trim().toLowerCase()
      );
      if (isDupe) errs.name = `"${itemForm.name}" already exists in this folder.`;
    }
    setItemErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Save item to backend ────────────────────────────────────────────────────
  const addItem = async () => {
    if (!validateItem()) return;
    setSaving(true);
    try {
      const res = await folderAPI.addItem(
        folders[selectedFolder]._id,
        { name: itemForm.name, weight: itemForm.weight, desc: itemForm.desc },
        itemForm.imageFile
      );
      setFolders((prev) =>
        prev.map((f, i) =>
          i === selectedFolder
            ? { ...f, items: [...f.items, res.data.data] }
            : f
        )
      );
      setShowAddItem(false);
    } catch (err) {
      setItemErrors({ name: err.response?.data?.error || "Failed to add item." });
    } finally {
      setSaving(false);
    }
  };

  // ── Remove item ─────────────────────────────────────────────────────────────
  const removeItem = async (itemIdx) => {
    const folder = folders[selectedFolder];
    const item   = folder.items[itemIdx];
    try {
      await folderAPI.removeItem(folder._id, item._id);
      setFolders((prev) =>
        prev.map((f, fi) =>
          fi === selectedFolder
            ? { ...f, items: f.items.filter((_, k) => k !== itemIdx) }
            : f
        )
      );
    } catch (err) {
      alert(err.response?.data?.error || "Failed to remove item.");
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <div className="section-title">Product Folders</div>
          <div style={{ color: theme.textMuted, fontSize: 13, marginTop: 4 }}>
            Manage your jewellery catalogue
          </div>
        </div>
        <button className="btn-primary" onClick={() => setShowAddFolder(true)}>
          <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <Icon name="plus" size={15} color="#0D0B07" /> New Folder
          </span>
        </button>
      </div>

      {/* ── Folder grid ── */}
      {selectedFolder === null ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 18 }}>
          {folders.map((f, i) => (
            <div
              key={f._id}
              className="card-hover fade-in"
              onClick={() => setSelectedFolder(i)}
              style={{
                background: theme.surface,
                border: `1px solid ${theme.borderGold}`,
                borderRadius: 14,
                padding: 24,
                cursor: "pointer",
                transition: "border-color 0.2s",
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = `${theme.gold}60`}
              onMouseLeave={e => e.currentTarget.style.borderColor = theme.borderGold}
            >
              {/* Icon row + delete button */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: `${theme.gold}18`,
                  border: `1px solid ${theme.borderGold}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon name={folderIcons[f.name] || "folder"} size={24} color={theme.gold} />
                </div>
                <button
                  className="btn-icon-danger"
                  onClick={(e) => removeFolder(i, e)}
                  title="Remove folder"
                  style={{ marginTop: 2 }}
                >
                  <Icon name="trash" size={13} color={theme.danger} />
                </button>
              </div>

              {/* Name */}
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, color: theme.text, marginBottom: 6 }}>
                {f.name}
              </div>

              {/* Item count */}
              <div style={{ fontSize: 13, color: theme.textMuted }}>
                {f.items.length} {f.items.length === 1 ? "item" : "items"}
              </div>
            </div>
          ))}

          {folders.length === 0 && (
            <div style={{
              gridColumn: "1/-1", padding: 56, textAlign: "center",
              color: theme.textMuted, background: theme.surface,
              border: `1px dashed ${theme.borderGold}`, borderRadius: 14,
            }}>
              <Icon name="folder" size={40} color={theme.borderGold} />
              <div style={{ marginTop: 16, fontSize: 15 }}>No folders yet</div>
              <div style={{ marginTop: 6, fontSize: 13 }}>Click "New Folder" to create your first category</div>
            </div>
          )}
        </div>
      ) : (
        /* ── Items inside folder ── */
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <button className="btn-ghost" onClick={() => setSelectedFolder(null)}>← Back</button>
            <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, color: theme.gold }}>
              {folders[selectedFolder]?.name}
            </span>
            <button className="btn-primary" style={{ marginLeft: "auto" }} onClick={openAddItem}>
              <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <Icon name="plus" size={15} color="#0D0B07" /> Add Item
              </span>
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
            {folders[selectedFolder]?.items.map((item, j) => (
              <div
                key={item._id}
                className="card-hover"
                style={{
                  background: theme.surface,
                  border: `1px solid ${theme.borderGold}`,
                  borderRadius: 13, overflow: "hidden",
                  transition: "border-color 0.2s",
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = `${theme.gold}60`}
                onMouseLeave={e => e.currentTarget.style.borderColor = theme.borderGold}
              >
                {item.image ? (
                  <img src={item.image} alt={item.name} style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }} />
                ) : (
                  <div style={{
                    width: "100%", height: 160, background: theme.surfaceAlt,
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8,
                  }}>
                    <Icon name="image" size={34} color={theme.borderGold} />
                    <span style={{ fontSize: 11, color: theme.borderGold }}>No image</span>
                  </div>
                )}
                <div style={{ padding: "16px 18px 18px" }}>
                  <div style={{ fontSize: 15, color: theme.text, marginBottom: 6 }}>{item.name}</div>
                  {item.weight > 0 && (
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, color: theme.gold, marginBottom: 4 }}>
                      {item.weight}g
                    </div>
                  )}
                  {item.desc && (
                    <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: 12, lineHeight: 1.5 }}>{item.desc}</div>
                  )}
                  <button
                    className="btn-danger"
                    style={{ width: "100%", textAlign: "center", marginTop: 8 }}
                    onClick={() => removeItem(j)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}

            {folders[selectedFolder]?.items.length === 0 && (
              <div style={{
                gridColumn: "1/-1", padding: 56, textAlign: "center",
                color: theme.textMuted, background: theme.surface,
                border: `1px dashed ${theme.borderGold}`, borderRadius: 13,
              }}>
                <Icon name="image" size={36} color={theme.borderGold} />
                <div style={{ marginTop: 14, fontSize: 14 }}>No items yet</div>
                <div style={{ marginTop: 6, fontSize: 13 }}>Click "Add Item" to add your first piece</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Add Folder Modal ── */}
      {showAddFolder && (
        <Modal title="✦ Create New Folder" onClose={() => setShowAddFolder(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <Field label="Folder Name *">
              <input value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="e.g. Pendant, Bangles..." autoFocus />
            </Field>
            <div style={{ display: "flex", gap: 12 }}>
              <button className="btn-primary" onClick={addFolder} style={{ flex: 1 }}>Create Folder</button>
              <button className="btn-ghost" onClick={() => setShowAddFolder(false)}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Add Item Modal ── */}
      {showAddItem && (
        <Modal title={`✦ Add Item to ${folders[selectedFolder]?.name}`} onClose={() => setShowAddItem(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <Field label="Item Name *" error={itemErrors.name}>
              <input
                value={itemForm.name}
                onChange={(e) => { setItemForm({ ...itemForm, name: e.target.value }); setItemErrors((p) => ({ ...p, name: null })); }}
                placeholder="e.g. Diamond Solitaire"
                autoFocus
              />
            </Field>
            <Field label="Weight (grams)">
              <input type="number" value={itemForm.weight} onChange={(e) => setItemForm({ ...itemForm, weight: e.target.value })} placeholder="e.g. 8.5" />
            </Field>
            <Field label="Description">
              <input value={itemForm.desc} onChange={(e) => setItemForm({ ...itemForm, desc: e.target.value })} placeholder="Design notes, karat, stone details..." />
            </Field>

            {/* Image upload */}
            <Field label="Item Image (JPG · JPEG · PNG · AVIF)" error={itemErrors.image}>
              <input ref={imgRef} type="file" accept=".jpg,.jpeg,.png,.avif" style={{ display: "none" }} onChange={handleImageChange} />
              {itemForm.imagePreview ? (
                <div style={{ position: "relative" }}>
                  <img
                    src={itemForm.imagePreview} alt="preview"
                    style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 8, border: `1px solid ${theme.borderGold}` }}
                  />
                  <button
                    onClick={() => setItemForm((f) => ({ ...f, imagePreview: null, imageFile: null }))}
                    style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.65)", border: "none", borderRadius: "50%", width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <Icon name="close" size={14} color="#fff" />
                  </button>
                </div>
              ) : (
                <div className="img-upload-box" onClick={() => imgRef.current.click()}>
                  <Icon name="image" size={28} color={theme.textMuted} />
                  <div style={{ color: theme.textMuted, fontSize: 13, marginTop: 8 }}>Click to upload image</div>
                  <div style={{ color: theme.borderGold, fontSize: 11, marginTop: 4 }}>JPG · JPEG · PNG · AVIF</div>
                </div>
              )}
            </Field>

            <div style={{ display: "flex", gap: 12 }}>
              <button className="btn-primary" onClick={addItem} style={{ flex: 1 }} disabled={saving}>
                {saving ? "Uploading..." : "Add Item"}
              </button>
              <button className="btn-ghost" onClick={() => setShowAddItem(false)} disabled={saving}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Products;
