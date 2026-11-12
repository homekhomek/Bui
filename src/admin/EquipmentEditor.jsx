// Admin editor for one equipment draft: stats, color, art, live preview.

import { INVENTORY, LIMITS, TOOLTIP } from '../data.js';
import { EquipmentPiece, step } from '../ui/Inventory.jsx';
import { EquipmentTooltip } from '../ui/tooltip/tooltipTypes.jsx';
import { useTooltip } from '../ui/tooltip/Tooltip.jsx';
import { ArtFile, ColorPicker, EquipmentThumb, Field, Label, NumberInput, RarityPicker } from './controls.jsx';
import { equipmentArtTemplate } from './artTemplates.js';
import { EQUIPMENT_ICONS, KINDS, num } from './entities.js';
import { a } from './strings.js';

function IconChoice({ icon, color, selected, onClick }) {
  const tooltip = useTooltip('text', { text: icon ? `${icon}.svg` : a('iconNone') });
  return (
    <button
      {...tooltip}
      onClick={onClick}
      className={`p-1 rounded-tile border-stroke ${selected ? 'border-dusk bg-mist' : 'border-transparent hover:bg-haze'}`}
    >
      <EquipmentThumb color={color} icon={icon} />
    </button>
  );
}

// update(fn): fn(draft) returns the fields to change.
export default function EquipmentEditor({ draft, update }) {
  const entry = KINDS.equipment.toEntry(draft);
  const slots = Math.max(0, Math.min(LIMITS.maxNodeSlots, Math.floor(num(draft.nodeSlots)) || 0));
  const preview = { ...entry, nodeSlots: slots };

  return (
    <div className="flex flex-wrap items-start gap-8">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-4">
          <Field label={<Label k="fieldSlots" />}>
            <NumberInput
              min="1"
              max={LIMITS.maxNodeSlots}
              value={draft.nodeSlots}
              onChange={(nodeSlots) => update(() => ({ nodeSlots }))}
            />
          </Field>
          <Field label={<Label k="fieldRate" />}>
            <NumberInput min="0" value={draft.chargeRate} onChange={(chargeRate) => update(() => ({ chargeRate }))} />
          </Field>
          <Field label={<Label k="fieldHp" />}>
            <NumberInput value={draft.hp} onChange={(hp) => update(() => ({ hp }))} />
          </Field>
        </div>

        <Field label={a('fieldRarity')}>
          <RarityPicker value={draft.rarity} onChange={(rarity) => update(() => ({ rarity }))} />
        </Field>

        <Field label={a('fieldColor')}>
          <ColorPicker value={draft.color} onChange={(color) => update(() => ({ color }))} />
        </Field>

        <Field label={a('fieldIcon')}>
          <div className="flex flex-wrap gap-1">
            {['', ...EQUIPMENT_ICONS].map((icon) => (
              <IconChoice
                key={icon}
                icon={icon}
                color={draft.color}
                selected={draft.icon === icon}
                onClick={() => update(() => ({ icon }))}
              />
            ))}
          </div>
        </Field>

        <Field label={a('fieldArt')}>
          <ArtFile folder="equipment" name={draft.id} build={equipmentArtTemplate} onCreated={(icon) => update(() => ({ icon }))} />
        </Field>
      </div>

      <Field label={a('rowPreview')}>
        <div className="relative" style={{ width: (slots + 1) * step() - INVENTORY.gapPx, height: INVENTORY.cellPx }}>
          <div className="absolute left-0 top-0">
            <EquipmentPiece def={draft.id} data={preview} interactive={false} />
          </div>
          {Array.from({ length: slots }, (_, x) => (
            <div
              key={x}
              className="absolute rounded-tile bg-haze"
              style={{ width: INVENTORY.cellPx, height: INVENTORY.cellPx, left: (x + 1) * step(), top: 0 }}
            />
          ))}
        </div>
        <span className="text-slate">{a('tooltipPreview')}</span>
        <div className="rounded-panel border-stroke border-dusk bg-blush px-4 py-2" style={{ maxWidth: TOOLTIP.maxWidthPx }}>
          <EquipmentTooltip id={draft.id} equipment={entry} name={draft.name} />
        </div>
      </Field>
    </div>
  );
}
