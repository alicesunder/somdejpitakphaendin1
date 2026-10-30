import React from 'react';

/**
 * Slow-drifting golden light behind the whole storefront: three blurred glows that breathe
 * and wander. Purely decorative (no pointer events), blended with `screen` so it only ever
 * brightens, kept faint so text contrast is unaffected, and frozen for reduced motion.
 */
export const AmbientLight: React.FC = () => (
  <div aria-hidden="true" className="ambient-light no-print">
    <span className="ambient-orb ambient-orb-a" />
    <span className="ambient-orb ambient-orb-b" />
    <span className="ambient-orb ambient-orb-c" />
  </div>
);
