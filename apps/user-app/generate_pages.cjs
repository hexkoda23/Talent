const fs = require('fs');
const content = fs.readFileSync('src/pages/dashboard/Leaderboard.tsx', 'utf-8');

const scopes = ['global', 'campus', 'course', 'program'];

for (const scope of scopes) {
  const ComponentName = 'Leaderboard' + scope.charAt(0).toUpperCase() + scope.slice(1);
  const Title = scope.charAt(0).toUpperCase() + scope.slice(1) + ' Leaderboard';
  
  let newContent = content.replace('const Leaderboard = () => {', 'const ' + ComponentName + ' = () => {\n  const scope = "' + scope + '";');
  newContent = newContent.replace('export default Leaderboard;', 'export default ' + ComponentName + ';');
  newContent = newContent.replace('const { scope = "global" } = useParams<{ scope: string }>();', '');
  newContent = newContent.replace('import { useParams, useNavigate } from "react-router-dom";', 'import { useNavigate } from "react-router-dom";');
  
  const tabsHTML = `
        <div className="flex gap-2 p-1 rounded-xl bg-muted border border-border">
          {['global', 'campus', 'course', 'program'].map((s) => (
            <button
              key={s}
              onClick={() => navigate(\`/dashboard/leaderboard/\${s}\`)}
              className={cn(
                "px-4 h-9 rounded-lg text-sm font-medium capitalize transition-all",
                scope === s ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {s}
            </button>
          ))}
        </div>
`;
  
  newContent = newContent.replace('<h1 className="font-display text-3xl lg:text-4xl font-bold\">Leaderboard</h1>', '<h1 className="font-display text-3xl lg:text-4xl font-bold">' + Title + '</h1>');
  newContent = newContent.replace('</div>\n\n      </div>\n\n      {/* Personal rank widget */}', '</div>' + tabsHTML + '</div>\n\n      {/* Personal rank widget */}');
  
  fs.writeFileSync('src/pages/dashboard/' + ComponentName + '.tsx', newContent);
}
