import React from "react";

export function NoWalletDetected() {
  return (
    <div className="container">
      <div className="row justify-content-md-center">
        <div className="col-6 p-4 text-center">
          <p>
            Nenhuma carteira encontrada. Instale a{" "}
            <a href="https://metamask.io" target="_blank" rel="noopener noreferrer">
              MetaMask
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
