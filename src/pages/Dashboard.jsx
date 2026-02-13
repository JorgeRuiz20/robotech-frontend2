import AdminPanel from '../components/dashboard/AdminPanel';
import ClubOwnerPanel from '../components/dashboard/ClubOwnerPanel';
import CompetitorPanel from '../components/dashboard/CompetitorPanel';
import UserPanel from '../components/dashboard/UserPanel';
import JudgePanel from '../components/dashboard/JudgePanel';

function Dashboard({ type }) {
  const panels = {
    admin: <AdminPanel />,
    clubowner: <ClubOwnerPanel />,
    competitor: <CompetitorPanel />,
    judge: <JudgePanel />,
    user: <UserPanel />
  };

  return panels[type] || <UserPanel />;
}

export default Dashboard;