"use client";

import { useState } from "react";
import { isSecretConfigKey } from "@/lib/secret-mask";

interface CredFieldProps {
  id: string;
  label: string;
  desc?: string;
  isSecret?: boolean;
  value: string;
  editable: boolean;
  onChange: (val: string) => void;
}

function CredField({ id, label, desc, isSecret = false, value, editable, onChange }: CredFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label className="text-xs text-subtle block mb-0.5">
        {label} {desc && <span className="text-subtle">{desc}</span>}
      </label>
      <div className="relative">
        <input
          id={id}
          type={isSecret && !visible ? "password" : "text"}
          value={value}
          placeholder={label}
          readOnly={!editable}
          onChange={(e) => onChange(e.target.value)}
          title={isSecret && value ? "저장된 비밀값" : value}
          className={`w-full ${editable ? "bg-surface" : "bg-surface/50 cursor-default"} border border-border rounded px-3 py-2 pr-16 text-[11px] text-muted placeholder-subtle font-mono`}
        />
        {isSecret && (
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-subtle hover:text-muted"
          >
            {visible ? "Hide" : "Show"}
          </button>
        )}
      </div>
    </div>
  );
}

interface CredFieldGroup {
  title: string;
  fieldIndices: number[];
}

interface CredentialFormProps {
  channelKey: string;
  fields: string[];
  labels: string[];
  currentKeys: Record<string, string>;
  onSave: (keys: Record<string, string>) => Promise<void>;
  title?: string;
  badge?: { text: string; color: string };
  connectLabel?: string;
  /** 연결됨 표시 — OAuth 연결(토큰이 integrations에 있어 keys가 비어도)이나 키 저장으로 연결된 상태. */
  connected?: boolean;
  /** Group fields with section headers and borders (e.g., X's Consumer Keys / Access Token) */
  fieldGroups?: CredFieldGroup[];
}

export function CredentialForm({ channelKey, fields, labels, currentKeys, onSave, title, badge, connectLabel, connected, fieldGroups }: CredentialFormProps) {
  const hasKeys = Object.values(currentKeys).some((v) => v);
  const [editing, setEditing] = useState(!hasKeys);
  const [values, setValues] = useState<Record<string, string>>(() => {
    const v: Record<string, string> = {};
    fields.forEach((f) => (v[f] = currentKeys[f] || ""));
    return v;
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(values);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const renderField = (fieldIdx: number) => {
    const f = fields[fieldIdx];
    return (
      <CredField
        key={f}
        id={`ch-${channelKey}-${f}`}
        label={labels[fieldIdx]}
        isSecret={isSecretConfigKey(f)}
        value={values[f] || ""}
        editable={editing}
        onChange={(val) => setValues((prev) => ({ ...prev, [f]: val }))}
      />
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-muted">{title || "Credentials"}</h3>
        <div className="flex items-center gap-2">
          {connected && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/15 text-success border border-success/30">
              연결됨
            </span>
          )}
          {badge && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-accent-soft text-accent border border-accent/30">
              {badge.text}
            </span>
          )}
          {hasKeys && !editing && (
            <button onClick={() => setEditing(true)} className="text-[10px] text-accent hover:text-accent">
              {channelKey === "threads" || channelKey === "x" ? "Edit" : "Edit Credentials"}
            </button>
          )}
        </div>
      </div>
      {fieldGroups ? (
        <div className="space-y-4">
          {fieldGroups.map((group, gi) => (
            <div key={gi} className={gi < fieldGroups.length - 1 ? "border-b border-border/50 pb-3" : ""}>
              <p className="text-[10px] text-subtle uppercase tracking-wide mb-2">{group.title}</p>
              {group.fieldIndices.map((idx, j) => (
                <div key={fields[idx]} className={j > 0 ? "mt-2" : ""}>
                  {renderField(idx)}
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {fields.map((f, i) => renderField(i))}
        </div>
      )}
      {editing && (
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2 bg-accent text-text text-sm rounded hover:bg-accent-hover disabled:opacity-50"
          >
            {saving ? "Verifying..." : hasKeys ? "Update" : (connectLabel || "Connect")}
          </button>
          {hasKeys && (
            <button
              onClick={() => {
                setEditing(false);
                const v: Record<string, string> = {};
                fields.forEach((f) => (v[f] = currentKeys[f] || ""));
                setValues(v);
              }}
              className="px-4 py-2 bg-surface-2 text-muted text-sm rounded hover:bg-surface-2"
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
}
