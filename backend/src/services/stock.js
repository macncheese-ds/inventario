// Servicio de movimientos de inventario.
// Toda modificación de gavetas.cantidad debe hacerse dentro de una transacción
// usando estas funciones, para que el saldo y su historial queden siempre consistentes.

export class StockError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

// Bloquea la fila del ítem (SELECT ... FOR UPDATE) dentro de la transacción actual.
export async function lockItem(conn, gavetaId) {
  const [rows] = await conn.query(
    'SELECT * FROM gavetas WHERE id = ? FOR UPDATE',
    [gavetaId]
  );
  return rows[0] || null;
}

// Inserta una fila en stock_movements. Los campos *_snapshot guardan el estado del ítem
// en el momento del movimiento, para que el historial siga legible si el ítem cambia o se elimina.
export async function recordMovement(conn, {
  item, tipo, delta, antes, despues, referenciaId = null, actor = null
}) {
  await conn.query(
    `INSERT INTO stock_movements
       (gaveta_id, ndp_snapshot, articulo_snapshot, area_snapshot, tipo,
        cantidad_delta, cantidad_antes, cantidad_despues, referencia_id, actor)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      item.id, item.ndp ?? null, item.articulo ?? null, item.area ?? null, tipo,
      delta, antes, despues, referenciaId, actor
    ]
  );
}

// Aplica un cambio relativo (delta) al saldo y registra el movimiento.
// Por defecto no permite saldo negativo; las salidas que lo causarían se rechazan.
export async function applyStockDelta(conn, gavetaId, {
  delta, tipo, actor = null, referenciaId = null, allowNegative = false
}) {
  const item = await lockItem(conn, gavetaId);
  if (!item) throw new StockError('Ítem no encontrado', 404);

  const antes = Number(item.cantidad || 0);
  const despues = antes + Number(delta);
  if (despues < 0 && !allowNegative) {
    throw new StockError(`No hay suficientes unidades (disponibles: ${antes})`, 400);
  }

  await conn.query('UPDATE gavetas SET cantidad = ? WHERE id = ?', [despues, gavetaId]);
  await recordMovement(conn, {
    item, tipo, delta: Number(delta), antes, despues, referenciaId, actor
  });
  return { item, antes, despues };
}
