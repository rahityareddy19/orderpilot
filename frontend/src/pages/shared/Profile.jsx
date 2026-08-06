import { useApp } from '../../context/AppContext';
import Header from '../../components/Header';
import { User, Mail, ShieldCheck, Calendar } from 'lucide-react';

export default function Profile() {
  const { user } = useApp();

  return (
    <div>
      <Header
        title="User Profile"
        description="Your account information and role authorization details"
      />

      <div className="p-6 max-w-2xl">
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
            <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-xl">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{user?.name || 'User Name'}</h2>
              <span className="inline-block px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold uppercase tracking-wider mt-1">
                {user?.role || 'Customer'}
              </span>
            </div>
          </div>

          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Email Address</p>
                <p className="font-medium text-slate-900">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Role Authorization</p>
                <p className="font-medium text-slate-900">{user?.role?.toUpperCase()}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Member Since</p>
                <p className="font-medium text-slate-900">August 2026</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
