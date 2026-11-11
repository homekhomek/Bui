import { EDIT, EXPLORE, NODES } from '../data.js';
import { useEdit, useSlide } from './editContext.js';
import { EquipmentPiece, NodeShape } from './Inventory.jsx';
import EffectRow from './EffectRow.jsx';

// Gentle up-and-down bob for floating things; index offsets the cycle so
// neighbours don't bob in sync.
export const bobStyle = (index) => ({
  '--bob': `${EXPLORE.bobPx}px`,
  animation: `bob ${EXPLORE.bobMs}ms ease-in-out ${-index * EXPLORE.bobMs * EXPLORE.bobStagger}ms infinite`,
});

// A node, piece of equipment or effect floating in the ether: not in any
// grid, gently bobbing, draggable.
export default function FloatingItem({ node, index }) {
  const edit = useEdit();
  const slideRef = useSlide(node.uid);
  const dragging = edit.dragUid === node.uid;
  const isEquipment = node.kind === 'equipment';

  return (
    <div ref={slideRef} style={{ opacity: dragging ? EDIT.ghostOpacity : 1 }}>
      <div style={bobStyle(index)}>
        {node.kind === 'effect' ? (
          <EffectRow
            effect={node.effect}
            onPointerDown={(e) => edit.startDrag(e, node, 'float', slideRef.current, 'effect')}
          />
        ) : isEquipment ? (
          <EquipmentPiece
            def={node.def}
            onPointerDown={(e) => edit.startDrag(e, node, 'float', slideRef.current, 'equipment')}
          />
        ) : (
          <NodeShape
            def={NODES[node.def]}
            level={node.level}
            extra={node.extra}
            uid={node.uid}
            highlight={edit.hover?.upgrade === node.uid || edit.hover?.applyTo === node.uid}
            onPointerDown={(e) => edit.startDrag(e, node, 'float', slideRef.current)}
          />
        )}
      </div>
    </div>
  );
}
