import React from "react";

export function TuringForm({ titulo, botao, codinomes, max, onSubmit }) {
  return (
    <div className="mb-4">
      <h4>{titulo}</h4>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.target);
          const codinome = formData.get("codinome");
          const qtde = formData.get("qtde");
          if (codinome && qtde) {
            onSubmit(codinome, qtde);
          }
        }}
      >
        <div className="form-group">
          <label>Codinome</label>
          <select className="form-control" name="codinome" required>
            {codinomes.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Quantidade de TUR</label>
          <input
            className="form-control"
            type="number"
            step="any"
            min="0"
            max={max}
            name="qtde"
            placeholder="1.5"
            required
          />
        </div>
        <input className="btn btn-primary" type="submit" value={botao} />
      </form>
    </div>
  );
}
