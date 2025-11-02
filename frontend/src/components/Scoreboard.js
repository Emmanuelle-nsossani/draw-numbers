import React from "react";

export default function Scoreboard({ scores }) {
  return (
    <div>
      <h2>Meilleurs scores</h2>
      <ul>
        {scores.sort((a,b)=>b.score-a.score).map((s,i)=>(
          <li key={i}>{s.name} : {s.score}</li>
        ))}
      </ul>
    </div>
  );
}
