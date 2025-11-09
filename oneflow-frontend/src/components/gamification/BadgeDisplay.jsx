import React from "react";
import { Trophy, Lock } from "lucide-react";

const BADGE_ICONS = {
  first_steps: "🎯",
  early_bird: "🌅",
  night_owl: "🦉",
  speed_demon: "⚡",
  marathon_runner: "🏃",
  team_player: "👥",
  profit_maker: "💰",
  on_time_hero: "⏰",
  big_spender: "💳",
  money_maker: "💵",
};

const BADGE_INFO = {
  first_steps: { name: "First Steps", description: "Complete your first task", points: 10 },
  early_bird: { name: "Early Bird", description: "Log hours before 9 AM", points: 20 },
  night_owl: { name: "Night Owl", description: "Log hours after 8 PM", points: 20 },
  speed_demon: { name: "Speed Demon", description: "Complete 5 tasks in one day", points: 50 },
  marathon_runner: { name: "Marathon Runner", description: "7-day streak of logging hours", points: 100 },
  team_player: { name: "Team Player", description: "Work on 3+ projects simultaneously", points: 30 },
  profit_maker: { name: "Profit Maker", description: "Complete project with >30% profit", points: 150 },
  on_time_hero: { name: "On Time Hero", description: "Complete all tasks before deadline", points: 40 },
  big_spender: { name: "Big Spender", description: "Approve 10+ expenses", points: 60 },
  money_maker: { name: "Money Maker", description: "Generate ₹1,00,000+ revenue", points: 200 },
};

const BadgeDisplay = ({ achievements = [], userStats }) => {
  const earnedTypes = new Set(achievements.map(a => a.badge_type));
  const allBadges = Object.keys(BADGE_INFO);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Badges</h3>
        <div className="text-sm text-gray-600">
          {achievements.length} / {allBadges.length} earned
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {allBadges.map((badgeType) => {
          const isEarned = earnedTypes.has(badgeType);
          const achievement = achievements.find(a => a.badge_type === badgeType);
          const badge = BADGE_INFO[badgeType];

          return (
            <div
              key={badgeType}
              className={`relative group cursor-pointer transition-all duration-300 transform hover:scale-110 ${
                isEarned ? "opacity-100" : "opacity-50 grayscale"
              }`}
            >
              <div className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                isEarned 
                  ? "bg-gradient-to-br from-yellow-100 to-orange-100 border-yellow-300 shadow-md hover:shadow-lg" 
                  : "bg-gray-100 border-gray-300"
              }`}>
                <div className="text-center">
                  <div className="text-4xl mb-2">{BADGE_ICONS[badgeType]}</div>
                  {!isEarned && (
                    <div className="absolute top-2 right-2">
                      <Lock className="text-gray-400" size={16} />
                    </div>
                  )}
                  <p className="text-xs font-semibold text-gray-900 mt-2">
                    {badge.name}
                  </p>
                  {isEarned && achievement && (
                    <p className="text-xs text-gray-600 mt-1">
                      {new Date(achievement.earned_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-lg whitespace-nowrap">
                  <p className="font-semibold">{badge.name}</p>
                  <p className="text-gray-300">{badge.description}</p>
                  <p className="text-yellow-400 mt-1">+{badge.points} points</p>
                  {isEarned && achievement && (
                    <p className="text-gray-400 mt-1 text-xs">
                      Earned: {new Date(achievement.earned_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BadgeDisplay;

