import React from 'react';
import {
  STRING_TYPE_INFO,
  type BoardString,
  type BoardStringType,
} from '../../boardModel';
import styles from '../../InvestigationBoard.module.scss';

interface StringContextMenuProps {
  editing?: BoardString | null;
  editingMid?: { x: number; y: number } | null;

  editingTypes: BoardStringType[];
  boardSize: { w: number; h: number };
  onSetType: (id: string, type: BoardStringType) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}

export default function StringContextMenu({
  editing,
  editingMid,
  editingTypes,
  boardSize,
  onSetType,
  onRemove,
  onClose,
}: StringContextMenuProps) {
  if (!editing || !editingMid) return null;

  return (
    <div
      className={styles.stringMenu}
      style={{
        left: Math.min(Math.max(editingMid.x, 120), boardSize.w - 120),
        top: Math.min(editingMid.y + 14, boardSize.h - 60),
      }}
    >
      <span className={styles.stringMenuTitle}>İpin anlamı</span>
      <div className={styles.stringMenuTypes}>
        {editingTypes.map((type) => (
          <button
            key={type}
            type="button"
            className={`${styles.typeBtn} ${editing.type === type ? styles.typeBtnActive : ''}`}
            style={{ borderColor: STRING_TYPE_INFO[type].color }}
            title={STRING_TYPE_INFO[type].hint}
            onClick={() => onSetType(editing.id, type)}
          >
            <span
              className={styles.typeDot}
              style={{ background: STRING_TYPE_INFO[type].color }}
            />
            {STRING_TYPE_INFO[type].label}
          </button>
        ))}
      </div>
      {editingTypes.length === 1 && (
        <p className={styles.stringMenuNote}>
          Bu ip Düşün&apos;de değerlendirilmez. Renkli ip için bir şüpheliyi bir kanıta ya da iki kanıtı
          birbirine bağla.
        </p>
      )}
      <div className={styles.stringMenuFooter}>
        <button
          type="button"
          className={styles.linkBtn}
          onClick={() => onRemove(editing.id)}
        >
          İpi kopar
        </button>
        <button
          type="button"
          className={styles.linkBtn}
          onClick={onClose}
        >
          Tamam
        </button>
      </div>
    </div>
  );
}
