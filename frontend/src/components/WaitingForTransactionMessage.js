import React from "react";

export function WaitingForTransactionMessage({ txHash }) {
  return (
    <div className="alert alert-info" role="alert">
      Aguardando a transacao <strong>{txHash}</strong> ser minerada
    </div>
  );
}
