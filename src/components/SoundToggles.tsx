import { useEffect, useMemo, useRef } from 'react';
import type { IPASymbol } from '../data/loader';
import {
  RARE_GROUPS, CLASS_GROUPS, ALL_RARE, rareGroupOf, isClassSymbol,
} from '../utils/soundGroups';
import type { RareGroupId, ClassGroupId, ClassToggles } from '../utils/soundGroups';

interface Props {
  id: string;
  symbols: IPASymbol[];
  rareGroups: ReadonlySet<RareGroupId>;
  classToggles: ClassToggles;
  onRareChange: (next: Set<RareGroupId>) => void;
  onClassChange: (next: ClassToggles) => void;
}

/** A checkbox whose `indeterminate` state follows the prop (React has no attribute for it). */
const MasterCheckbox = ({ checked, indeterminate, onChange, label }: {
  checked: boolean; indeterminate: boolean; onChange: (v: boolean) => void; label: string;
}) => {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (ref.current) ref.current.indeterminate = indeterminate; }, [indeterminate]);
  return (
    <label className="sound-master">
      <input ref={ref} type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      {label}
    </label>
  );
};

const Samples = ({ syms }: { syms: IPASymbol[] }) => (
  <span className="sound-samples" aria-hidden="true">
    {syms.slice(0, 4).map(s => s.symbol).join(' ')}{syms.length > 4 ? ' …' : ''}
  </span>
);

/**
 * Checkbox panel for the sound types the matrix hides by default: rare sound
 * types (ejectives, clicks, ...) and secondary-articulation classes.
 */
export const SoundToggles = ({ id, symbols, rareGroups, classToggles, onRareChange, onClassChange }: Props) => {
  const rareMembers = useMemo(() => {
    const m = new Map<RareGroupId, IPASymbol[]>(ALL_RARE.map(g => [g, []]));
    for (const s of symbols) if (s.isExotic && !isClassSymbol(s)) m.get(rareGroupOf(s))!.push(s);
    return m;
  }, [symbols]);
  const classMembers = useMemo(() => new Map<ClassGroupId, IPASymbol[]>(
    CLASS_GROUPS.map(g => [g.id, symbols.filter(s => s[g.flag])])
  ), [symbols]);

  const rareOn = ALL_RARE.filter(g => rareGroups.has(g)).length;
  const classOn = CLASS_GROUPS.filter(g => classToggles[g.id]).length;

  const toggleRare = (g: RareGroupId, on: boolean) => {
    const next = new Set(rareGroups);
    if (on) next.add(g); else next.delete(g);
    onRareChange(next);
  };
  const setAllClasses = (on: boolean) =>
    onClassChange(Object.fromEntries(CLASS_GROUPS.map(g => [g.id, on])) as ClassToggles);

  return (
    <div id={id} className="advanced-filters sound-toggles">
      <fieldset>
        <legend>
          <MasterCheckbox
            label="Rare sound types"
            checked={rareOn === ALL_RARE.length}
            indeterminate={rareOn > 0 && rareOn < ALL_RARE.length}
            onChange={on => onRareChange(new Set(on ? ALL_RARE : []))}
          />
        </legend>
        <div className="sound-grid">
          {RARE_GROUPS.map(g => {
            const members = rareMembers.get(g.id) ?? [];
            if (members.length === 0) return null;
            return (
              <label key={g.id} className="sound-option" title={g.hint}>
                <input type="checkbox" checked={rareGroups.has(g.id)} onChange={e => toggleRare(g.id, e.target.checked)} />
                <span className="sound-label">{g.label} <span className="sound-count">{members.length}</span></span>
                <Samples syms={members} />
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend>
          <MasterCheckbox
            label="Secondary articulation"
            checked={classOn === CLASS_GROUPS.length}
            indeterminate={classOn > 0 && classOn < CLASS_GROUPS.length}
            onChange={setAllClasses}
          />
        </legend>
        <div className="sound-grid">
          {CLASS_GROUPS.map(g => {
            const members = classMembers.get(g.id) ?? [];
            return (
              <label key={g.id} className="sound-option" title={g.hint}>
                <input
                  type="checkbox" checked={classToggles[g.id]}
                  onChange={e => onClassChange({ ...classToggles, [g.id]: e.target.checked })}
                />
                <span className="sound-label">{g.label} <span className="sound-count">{members.length}</span></span>
                <Samples syms={members} />
              </label>
            );
          })}
        </div>
        <p className="sound-note">Aspirated retroflexes and alveolo-palatals (ʈʰ, ʈʂʰ, tɕʰ) follow the Aspirated box.</p>
      </fieldset>
    </div>
  );
};

export default SoundToggles;
