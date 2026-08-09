import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal, Award } from "lucide-react";
import { motion } from "framer-motion";

export const HallOfFame = () => {
  const ranking = [
    { name: "Ana Silva", xp: 12500, exercises: 45, icon: Trophy, color: "text-yellow-400" },
    { name: "Bruno Santos", xp: 11200, exercises: 42, icon: Medal, color: "text-gray-400" },
    { name: "Carla Oliveira", xp: 9800, exercises: 38, icon: Award, color: "text-amber-600" },
  ];

  return (
    <Card className="bg-black/40 border-cyan-500/30 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-cyan-400 font-space">
          <Trophy className="w-5 h-5" />
          Hall da Fama (Semanal)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {ranking.map((user, i) => (
          <motion.div
            key={user.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold text-white/40">#{i + 1}</span>
              <div>
                <p className="font-semibold text-white">{user.name}</p>
                <p className="text-xs text-white/50">{user.exercises} exercícios concluídos</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-cyan-400">{user.xp} XP</span>
              <user.icon className={`w-4 h-4 ${user.color}`} />
            </div>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
};
