import React from 'react';
import { Role } from '@/lib/types';
import { ShieldCheck, User, Sparkles, Layers } from 'lucide-react';

export interface Persona {
  id: string;
  name: string;
  role: Role;
  title: string;
  department: string;
}

export const PERSONAS: Persona[] = [
  {
    id: 'usr_alice_creator',
    name: 'Alice Vance',
    role: 'CREATOR',
    title: 'Sr. Product Operations Lead',
    department: 'Operations',
  },
  {
    id: 'usr_bob_reviewer',
    name: 'Bob Martinez',
    role: 'REVIEWER',
    title: 'VP of Engineering & Architecture',
    department: 'Engineering',
  },
];

interface NavbarProps {
  activePersona: Persona;
  onSwitchPersona: (persona: Persona) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activePersona, onSwitchPersona }) => {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Enterprise Subtitle */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-900 text-white shadow-sm ring-1 ring-slate-800">
              <Layers className="w-5 h-5 text-slate-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-slate-900">ReqFlow</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                  v1.2 Enterprise
                </span>
              </div>
              <p className="text-xs text-slate-500 font-normal hidden sm:block">
                Role-Governed Request Management System
              </p>
            </div>
          </div>

          {/* Interactive Persona Switcher Toggle */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="text-right hidden md:block">
              <div className="text-xs text-slate-400 font-medium">Active Simulation Persona</div>
              <div className="text-xs text-slate-600 font-mono">ID: {activePersona.id}</div>
            </div>

            <div className="flex items-center p-1 bg-slate-100 border border-slate-200 rounded-xl shadow-inner">
              {PERSONAS.map((persona) => {
                const isActive = persona.id === activePersona.id;
                return (
                  <button
                    key={persona.id}
                    onClick={() => onSwitchPersona(persona)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                    title={`Switch persona to ${persona.name} (${persona.role})`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        persona.role === 'CREATOR' ? 'bg-sky-500' : 'bg-indigo-600'
                      } ${isActive ? 'ring-2 ring-slate-300' : ''}`}
                    />
                    <span>{persona.name}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] uppercase tracking-wider font-semibold ${
                        persona.role === 'CREATOR'
                          ? 'bg-sky-50 text-sky-700 border border-sky-200'
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      }`}
                    >
                      {persona.role}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
