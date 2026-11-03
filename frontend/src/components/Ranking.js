import React from "react";
import { ethers } from "ethers";

export function Ranking({ ranking }) {
  return (
    <div>
      <h4>Ranking</h4>
      <table className="table table-sm">
        <thead>
          <tr>
            <th>#</th>
            <th>Codinome</th>
            <th className="text-right">TUR</th>
          </tr>
        </thead>
        <tbody>
          {ranking.map((u, i) => (
            <tr key={u.codinome}>
              <td>{i + 1}</td>
              <td>{u.codinome}</td>
              <td className="text-right">{ethers.utils.formatEther(u.saldo)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
