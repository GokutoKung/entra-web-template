import AccountCard from './AccountCard';
import GraphPanel from './GraphPanel';
import TokenPanel from './TokenPanel';

export default function Dashboard() {
  return (
    <div className="grid">
      <AccountCard />
      <TokenPanel />
      <GraphPanel />
    </div>
  );
}
