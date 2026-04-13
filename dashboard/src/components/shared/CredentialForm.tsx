"use client";

import { useState } from "react";

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
      <label className="text-xs text-gray-400 block mb-0.5">
        {label} {desc && <span className="text-gray-600">{desc}</span>}
      </label>
      <div className="relative">
        <input
          id={id}
          type={isSecret && !visible ? "password" : "text"}
          value={value}
          placeholder={label}
          readOnly={!editable}
          onChange={(e) => onChange(e.target.value)}
          title={value}
          className={`w-full ${editable ? "bg-gray-900" : "bg-gray-900/50 cursor-default"} border border-gray-700 rounded px-3 py-2 pr-16 text-[11px] text-gray-300 placeholder-gray-600 font-mono`}
        />
        {isSecret && (
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 hover:text-gray-300"
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
  /** Group fields with section headers and borders (e.g., X's Consumer Keys / Access Token) */
  fieldGroups?: CredFieldGroup[];
}

export function CredentialForm({ channelKey, fields, labels, currentKeys, onSave, title, badge, connectLabel, fieldGroups }: CredentialFormProps) {
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
        isSecret={/secret|password|token/i.test(f)}
        value={values[f] || ""}
        editable={editing}
        onChange={(val) => setValues((prev) => ({ ...prev, [f]: val }))}
      />
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-300">{title || "Credentials"}</h3>
        <div className="flex items-center gap-2">
          {badge && (
            <span className={`text-[10px] px-2 py-0.5 rounded bg-${badge.color}-900/30 text-${badge.color}-400 border border-${badge.color}-800/30`}>
              {badge.text}
            </span>
          )}
          {hasKeys && !editing && (
            <button onClick={() => setEditing(true)} className="text-[10px] text-blue-400 hover:text-blue-300">
              {channelKey === "threads" || channelKey === "x" ? "Edit" : "Edit Credentials"}
            </button>
          )}
        </div>
      </div>
      {fieldGroups ? (
        <div className="space-y-4">
          {fieldGroups.map((group, gi) => (
            <div key={gi} className={gi < fieldGroups.length - 1 ? "border-b border-gray-800/50 pb-3" : ""}>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-2">{group.title}</p>
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
            className="flex-1 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-500 disabled:opacity-50"
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
              className="px-4 py-2 bg-gray-800 text-gray-300 text-sm rounded hover:bg-gray-700"
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
}
