import React from "react";

export function VotingControls({ voting, votingOn, votingOff }) {
  return (
    <div className="mb-4">
      <h4>Votacao</h4>
      <button className="btn btn-success mr-2" disabled={voting} onClick={votingOn}>
        votingOn
      </button>
      <button className="btn btn-secondary" disabled={!voting} onClick={votingOff}>
        votingOff
      </button>
    </div>
  );
}
