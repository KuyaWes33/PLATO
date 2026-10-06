/* Plato exercise library.
   eq: "none" = no equipment, "gym" = needs gym equipment
   type: "reps" or "time"; met: effort level used for calorie estimates
   avoid: limitations this exercise isn't a good fit for (knees, back, shoulders, wrists)
   role: main, warmup, cooldown */
const EXERCISES = {
  // ---------- warm-up / cool-down ----------
  arm_circles: {
    name: "Arm circles", eq: "none", area: ["shoulders"], role: "warmup", type: "time", secs: 40, met: 2.5, avoid: [],
    muscles: "Shoulders, upper back",
    steps: ["Stand tall with your arms straight out to the sides.", "Draw small circles forward, slowly making them bigger.", "Halfway through, reverse the direction."],
    tips: ["Keep your shoulders down, away from your ears.", "Move smoothly. This is a warm-up, not a workout."],
    easier: "Make the circles smaller.", harder: "Make the circles bigger and slower.",
  },
  forward_fold: {
    name: "Standing forward fold", eq: "none", area: ["stretch", "legs"], role: "cooldown", type: "time", secs: 45, met: 2.0, avoid: ["back"],
    muscles: "Hamstrings, lower back, calves",
    steps: ["Stand with feet hip-width apart and knees soft.", "Hinge at your hips and let your upper body hang toward the floor.", "Let your arms and head relax. Breathe slowly."],
    tips: ["Bend your knees as much as you need to.", "Stretch to mild tension, never pain."],
    easier: "Rest your hands on your thighs or a chair.", harder: "Straighten your legs a little more.",
  },
  childs_pose: {
    name: "Child's pose", eq: "none", area: ["stretch", "back"], role: "cooldown", type: "time", secs: 45, met: 1.8, avoid: ["knees"],
    muscles: "Lower back, hips, shoulders",
    steps: ["Kneel and sit back toward your heels.", "Walk your hands forward and lower your chest toward the floor.", "Rest your forehead down and breathe deeply."],
    tips: ["Widen your knees if your hips feel tight.", "Let your back relax with each breath out."],
    easier: "Put a pillow between your heels and hips.", harder: "Walk your hands farther forward.",
  },

  // ---------- no equipment ----------
  jumping_jack: {
    name: "Jumping jacks", eq: "none", area: ["cardio"], role: "main", type: "time", secs: 40, met: 8.0, avoid: ["knees"], intense: true,
    muscles: "Full body, heart and lungs",
    steps: ["Stand with feet together and arms at your sides.", "Jump your feet out wide while swinging your arms overhead.", "Jump back to the start and keep a steady rhythm."],
    tips: ["Land softly on the balls of your feet.", "Breathe steadily. Don't hold your breath."],
    easier: "Step one foot out at a time instead of jumping.", harder: "Go faster, or add a squat when you land wide.",
  },
  high_knees: {
    name: "High knees", eq: "none", area: ["cardio", "legs"], role: "main", type: "time", secs: 30, met: 8.0, avoid: ["knees"], intense: true,
    muscles: "Hip flexors, legs, heart and lungs",
    steps: ["Stand tall with your feet hip-width apart.", "Drive one knee up toward hip height, then switch quickly.", "Pump your arms like you're running in place."],
    tips: ["Stay on the balls of your feet.", "Keep your chest up. Don't lean back."],
    easier: "March in place, lifting each knee high.", harder: "Speed up while keeping your knees high.",
  },
  squat: {
    name: "Bodyweight squat", eq: "none", area: ["legs", "glutes"], role: "main", type: "reps", reps: 12, met: 5.0, avoid: [],
    muscles: "Thighs, glutes, core",
    steps: ["Stand with feet shoulder-width apart, toes slightly out.", "Push your hips back and bend your knees as if sitting in a chair.", "Go as low as is comfortable, keeping your chest up.", "Push through your whole foot to stand back up."],
    tips: ["Keep your knees in line with your toes.", "Keep your heels down the whole time."],
    easier: "Squat down to a chair and stand back up.", harder: "Pause for 2 seconds at the bottom.",
  },
  reverse_lunge: {
    name: "Reverse lunge", eq: "none", area: ["legs", "glutes"], role: "main", type: "reps", reps: 10, met: 5.0, avoid: ["knees"],
    muscles: "Thighs, glutes, balance",
    steps: ["Stand tall with feet hip-width apart.", "Step one foot back and lower until both knees bend to about 90°.", "Push through your front heel to come back up.", "Alternate legs each rep, or do all reps on one side first."],
    tips: ["Keep your front knee over your ankle.", "Lower straight down instead of leaning forward."],
    easier: "Hold a wall or chair for balance and take shorter steps.", harder: "Pause for 2 seconds at the bottom of each rep.",
  },
  calf_raise: {
    name: "Calf raise", eq: "none", area: ["legs"], role: "main", type: "reps", reps: 15, met: 3.0, avoid: [],
    muscles: "Calves, ankles",
    steps: ["Stand tall with feet hip-width apart.", "Rise up onto the balls of your feet as high as you can.", "Pause, then lower your heels slowly."],
    tips: ["Lower slowly, taking about 2 seconds.", "Use a wall for balance if you need to."],
    easier: "Hold onto a wall or chair.", harder: "Do it on one leg, or on a step.",
  },
  pushup: {
    name: "Push-up", eq: "none", area: ["chest", "arms", "shoulders"], role: "main", type: "reps", reps: 10, met: 5.0, avoid: ["wrists", "shoulders"],
    muscles: "Chest, shoulders, triceps, core",
    steps: ["Start in a high plank with hands slightly wider than your shoulders.", "Keep a straight line from head to heels.", "Lower your chest toward the floor, elbows at about 45°.", "Push the floor away to return to the top."],
    tips: ["Squeeze your glutes so your hips don't sag.", "Keep your neck long and look slightly ahead."],
    easier: "Do knee push-ups, or push-ups against a wall or table.", harder: "Lower for 3 slow seconds on each rep.",
  },
  knee_pushup: {
    name: "Knee push-up", eq: "none", area: ["chest", "arms", "shoulders"], role: "main", type: "reps", reps: 10, met: 4.0, avoid: ["wrists"],
    muscles: "Chest, shoulders, triceps",
    steps: ["Start on your hands and knees, hands under your shoulders.", "Walk your hands forward until your body is a straight line from head to knees.", "Lower your chest toward the floor.", "Press back up."],
    tips: ["Keep your hips in line. Don't let them pike up.", "Put a folded towel under your knees for comfort."],
    easier: "Do push-ups against a wall.", harder: "Progress to full push-ups.",
  },
  plank: {
    name: "Forearm plank", eq: "none", area: ["core"], role: "main", type: "time", secs: 30, met: 3.5, avoid: [],
    muscles: "Abs, core, shoulders",
    steps: ["Rest on your forearms with elbows under your shoulders.", "Step your feet back so your body is a straight line.", "Brace your stomach and hold. Breathe slowly."],
    tips: ["Don't let your hips sag or rise too high.", "Press your forearms into the floor."],
    easier: "Hold the plank on your knees.", harder: "Hold longer, or lift one foot for a few seconds.",
  },
  mountain_climber: {
    name: "Mountain climbers", eq: "none", area: ["core", "cardio"], role: "main", type: "time", secs: 30, met: 8.0, avoid: ["wrists"], intense: true,
    muscles: "Core, shoulders, heart and lungs",
    steps: ["Start in a high plank with hands under your shoulders.", "Drive one knee toward your chest.", "Switch legs quickly, like running in place."],
    tips: ["Keep your hips low and level.", "Keep your shoulders over your hands."],
    easier: "Step each foot in slowly instead of running.", harder: "Speed up while keeping good form.",
  },
  burpee: {
    name: "Burpee", eq: "none", area: ["cardio"], role: "main", type: "reps", reps: 8, met: 8.0, avoid: ["knees", "back", "wrists", "shoulders"], intense: true,
    muscles: "Full body, heart and lungs",
    steps: ["From standing, squat down and place your hands on the floor.", "Jump or step your feet back into a plank.", "Jump or step your feet back toward your hands.", "Stand up and jump, reaching your arms overhead."],
    tips: ["Land softly with bent knees.", "Step instead of jumping if you need a breather."],
    easier: "Step back and forward, and skip the jump.", harder: "Add a push-up at the plank.",
  },
  glute_bridge: {
    name: "Glute bridge", eq: "none", area: ["glutes", "legs"], role: "main", type: "reps", reps: 12, met: 3.5, avoid: [],
    muscles: "Glutes, hamstrings, lower back",
    steps: ["Lie on your back with knees bent and feet flat, hip-width apart.", "Press through your heels and lift your hips.", "Squeeze your glutes at the top, then lower slowly."],
    tips: ["Make a straight line from knees to shoulders at the top.", "Don't arch your lower back."],
    easier: "Lift your hips only partway.", harder: "Do it on one leg, or pause 3 seconds at the top.",
  },
  crunch: {
    name: "Crunch", eq: "none", area: ["core"], role: "main", type: "reps", reps: 15, met: 3.0, avoid: ["back"],
    muscles: "Abs",
    steps: ["Lie on your back with knees bent and feet flat.", "Reach your hands toward your knees.", "Curl your shoulders off the floor using your abs.", "Lower back down with control."],
    tips: ["Lift with your stomach, not your neck.", "Breathe out as you curl up."],
    easier: "Make the movement smaller.", harder: "Hold the top for 2 seconds.",
  },
  leg_raise: {
    name: "Lying leg raise", eq: "none", area: ["core"], role: "main", type: "reps", reps: 10, met: 3.5, avoid: ["back"],
    muscles: "Lower abs, hip flexors",
    steps: ["Lie on your back with legs straight and arms by your sides.", "Press your lower back into the floor.", "Lift your legs up until they point at the ceiling.", "Lower them slowly without touching the floor."],
    tips: ["Stop lowering before your back starts to arch.", "Move slowly. Don't swing."],
    easier: "Bend your knees as you lift.", harder: "Lower even more slowly.",
  },
  bird_dog: {
    name: "Bird dog", eq: "none", area: ["core", "back"], role: "main", type: "reps", reps: 10, met: 3.0, avoid: [],
    muscles: "Core, lower back, glutes",
    steps: ["Start on hands and knees, hands under shoulders and knees under hips.", "Reach one arm forward and the opposite leg back.", "Hold for a moment, then return and switch sides."],
    tips: ["Keep your hips level, as if balancing a glass on your back.", "Move slowly and with control."],
    easier: "Lift only the arm or only the leg.", harder: "Hold each rep for 3 seconds.",
  },
  superman: {
    name: "Superman", eq: "none", area: ["back", "core"], role: "main", type: "reps", reps: 12, met: 3.0, avoid: ["back"],
    muscles: "Lower back, glutes, upper back",
    steps: ["Lie face down with arms stretched forward.", "Lift your arms, chest and legs a few centimetres off the floor.", "Hold briefly, then lower slowly."],
    tips: ["Look down to keep your neck relaxed.", "Lift low and controlled. Height isn't the goal."],
    easier: "Lift only your arms, or only your legs.", harder: "Hold the top for 3 seconds.",
  },

  // ---------- gym ----------
  goblet_squat: {
    name: "Goblet squat", eq: "gym", gear: "Kettlebell or dumbbell", area: ["legs", "glutes"], role: "main", type: "reps", reps: 10, met: 5.5, avoid: [],
    muscles: "Thighs, glutes, core",
    steps: ["Hold a kettlebell or dumbbell against your chest.", "Stand with feet shoulder-width apart.", "Squat down between your knees, chest up.", "Drive up through your whole foot."],
    tips: ["Keep your elbows inside your knees at the bottom.", "Keep the weight close to your chest."],
    easier: "Use a lighter weight, or squat to a bench.", harder: "Pause 2 seconds at the bottom.",
  },
  barbell_back_squat: {
    name: "Barbell back squat", eq: "gym", gear: "Barbell and squat rack", area: ["legs", "glutes"], role: "main", type: "reps", reps: 8, met: 6.0, avoid: ["knees", "back"],
    muscles: "Thighs, glutes, core, lower back",
    steps: ["Set the bar on your upper back, not your neck, and grip it just outside your shoulders.", "Step back with feet shoulder-width apart.", "Brace your core and squat until your thighs are about parallel to the floor.", "Drive up, keeping your chest up."],
    tips: ["Use the rack's safety bars.", "Keep your knees tracking over your toes."],
    easier: "Do goblet squats instead.", harder: "Add weight in small steps over the weeks.",
  },
  romanian_deadlift: {
    name: "Romanian deadlift", eq: "gym", gear: "Barbell or dumbbells", area: ["legs", "glutes", "back"], role: "main", type: "reps", reps: 10, met: 5.0, avoid: ["back"],
    muscles: "Hamstrings, glutes, lower back",
    steps: ["Stand holding the bar at your hips, knees slightly bent.", "Push your hips back and slide the bar down your thighs.", "Lower until you feel a stretch in your hamstrings.", "Squeeze your glutes to stand back up."],
    tips: ["Keep your back flat and the bar close to your legs.", "Your knees bend only a little. This is a hip hinge."],
    easier: "Use light dumbbells.", harder: "Take 3 slow seconds to lower.",
  },
  deadlift: {
    name: "Deadlift", eq: "gym", gear: "Barbell", area: ["back", "legs", "glutes"], role: "main", type: "reps", reps: 6, met: 6.0, avoid: ["back"],
    muscles: "Back, glutes, hamstrings, grip",
    steps: ["Stand with the bar over your mid-foot.", "Hinge and bend your knees to grip the bar just outside your legs.", "Flatten your back, brace, and push the floor away to stand up.", "Lower the bar the same way, under control."],
    tips: ["Keep the bar touching your legs as it moves.", "Never round your lower back."],
    easier: "Do Romanian deadlifts with dumbbells.", harder: "Add weight gradually, one session at a time.",
  },
  bent_over_row: {
    name: "Bent-over row", eq: "gym", gear: "Barbell or dumbbells", area: ["back", "arms"], role: "main", type: "reps", reps: 10, met: 5.0, avoid: ["back"],
    muscles: "Upper back, lats, biceps",
    steps: ["Hold the bar and hinge forward with a flat back, knees soft.", "Let your arms hang straight.", "Pull the bar toward your lower ribs, squeezing your shoulder blades.", "Lower it with control."],
    tips: ["Keep your torso still. Don't swing.", "Lead with your elbows."],
    easier: "Do one-arm dumbbell rows with your hand on a bench.", harder: "Pause 1 second at the top.",
  },
  db_bench_press: {
    name: "Dumbbell bench press", eq: "gym", gear: "Dumbbells and a bench", area: ["chest", "arms", "shoulders"], role: "main", type: "reps", reps: 10, met: 5.0, avoid: ["shoulders"],
    muscles: "Chest, shoulders, triceps",
    steps: ["Lie on a flat bench with feet on the floor, holding dumbbells over your chest.", "Lower them slowly to the sides of your chest, elbows at about 45°.", "Press them back up until your arms are straight."],
    tips: ["Keep your shoulder blades pulled back into the bench.", "Control the lowering. Don't drop."],
    easier: "Use lighter dumbbells.", harder: "Take 3 slow seconds to lower.",
  },
  db_shoulder_press: {
    name: "Dumbbell shoulder press", eq: "gym", gear: "Dumbbells", area: ["shoulders", "arms"], role: "main", type: "reps", reps: 10, met: 4.5, avoid: ["shoulders"],
    muscles: "Shoulders, triceps, upper back",
    steps: ["Stand holding dumbbells at shoulder height, palms forward.", "Brace your core and press the weights overhead.", "Lower them back to your shoulders slowly."],
    tips: ["Don't arch your lower back. Squeeze your glutes.", "Press straight up, not forward."],
    easier: "Sit on a bench with back support.", harder: "Pause with your arms straight overhead.",
  },
  db_curl: {
    name: "Dumbbell curl", eq: "gym", gear: "Dumbbells", area: ["arms"], role: "main", type: "reps", reps: 12, met: 3.5, avoid: [],
    muscles: "Biceps, forearms",
    steps: ["Stand holding dumbbells at your sides, palms forward.", "Curl the weights up toward your shoulders.", "Lower them slowly to the start."],
    tips: ["Keep your elbows at your sides.", "Don't swing your body to lift the weight."],
    easier: "Use lighter weights, or one arm at a time.", harder: "Take 3 slow seconds to lower.",
  },
  db_lateral_raise: {
    name: "Lateral raise", eq: "gym", gear: "Dumbbells", area: ["shoulders"], role: "main", type: "reps", reps: 12, met: 3.5, avoid: ["shoulders"],
    muscles: "Side shoulders",
    steps: ["Stand holding light dumbbells at your sides.", "With a slight bend in your elbows, raise your arms out to shoulder height.", "Lower them slowly."],
    tips: ["Lead with your elbows, not your hands.", "Use a light weight. This adds up fast."],
    easier: "Raise them to just below shoulder height.", harder: "Pause 1 second at the top.",
  },
  db_lunge: {
    name: "Dumbbell lunge", eq: "gym", gear: "Dumbbells", area: ["legs", "glutes"], role: "main", type: "reps", reps: 10, met: 5.5, avoid: ["knees"],
    muscles: "Thighs, glutes, balance",
    steps: ["Hold dumbbells at your sides.", "Step one foot back and lower until both knees bend to about 90°.", "Push through your front heel to stand.", "Alternate legs."],
    tips: ["Keep your torso upright.", "Keep your front knee over your ankle."],
    easier: "Do bodyweight lunges first.", harder: "Use heavier dumbbells.",
  },
  lat_pulldown: {
    name: "Lat pulldown", eq: "gym", gear: "Lat pulldown machine", area: ["back", "arms"], role: "main", type: "reps", reps: 10, met: 4.5, avoid: [],
    muscles: "Lats, upper back, biceps",
    steps: ["Sit with your thighs under the pads and grab the bar wider than your shoulders.", "Lean back slightly and pull the bar to your upper chest.", "Squeeze your shoulder blades down and back.", "Let the bar rise slowly."],
    tips: ["Pull with your elbows, not your hands.", "Don't pull the bar behind your neck."],
    easier: "Lower the weight.", harder: "Pause 1 second with the bar at your chest.",
  },
  tricep_pushdown: {
    name: "Triceps pushdown", eq: "gym", gear: "Cable machine", area: ["arms"], role: "main", type: "reps", reps: 12, met: 3.5, avoid: [],
    muscles: "Triceps",
    steps: ["Face a high cable and grab the bar with palms down.", "Pin your elbows to your sides.", "Push the bar down until your arms are straight.", "Let it rise slowly to chest height."],
    tips: ["Only your forearms should move.", "Stand tall. Don't lean over the bar."],
    easier: "Lower the weight.", harder: "Pause 1 second with your arms straight.",
  },
  hip_thrust: {
    name: "Barbell hip thrust", eq: "gym", gear: "Barbell and a bench", area: ["glutes", "legs"], role: "main", type: "reps", reps: 10, met: 4.5, avoid: [],
    muscles: "Glutes, hamstrings",
    steps: ["Sit with your upper back against a bench and the bar over your hips. A pad helps.", "Plant your feet flat, about hip-width apart.", "Drive through your heels to lift your hips until your body is level.", "Lower with control."],
    tips: ["Tuck your chin and look forward at the top.", "Squeeze your glutes hard at the top."],
    easier: "Do glute bridges on the floor.", harder: "Pause 2 seconds at the top.",
  },
};

const AREAS = [
  ["all", "All"], ["legs", "Legs"], ["glutes", "Glutes"], ["chest", "Chest"], ["back", "Back"],
  ["shoulders", "Shoulders"], ["arms", "Arms"], ["core", "Core"], ["cardio", "Cardio"], ["stretch", "Stretch"],
];

const QUICK_WORKOUTS = {
  none: [
    { id: "home_full", name: "Full-body starter", note: "A balanced session for any level", tone: "violet", items: ["squat", "knee_pushup", "glute_bridge", "bird_dog", "plank"] },
    { id: "home_core", name: "Core focus", note: "Abs and lower back", tone: "pink", items: ["crunch", "leg_raise", "bird_dog", "plank", "mountain_climber"] },
    { id: "home_cardio", name: "Sweat session", note: "Short, fast and hard", tone: "orange", items: ["jumping_jack", "high_knees", "squat", "mountain_climber", "burpee"] },
    { id: "home_lower", name: "Legs and glutes", note: "No equipment needed", tone: "sky", items: ["squat", "reverse_lunge", "glute_bridge", "calf_raise", "superman"] },
    { id: "home_stretch", name: "Stretch and reset", note: "Ten easy minutes", tone: "lime", items: ["arm_circles", "forward_fold", "childs_pose", "bird_dog"], stretch: true },
  ],
  gym: [
    { id: "gym_full", name: "Full-body strength", note: "One big lift per area", tone: "violet", items: ["goblet_squat", "db_bench_press", "bent_over_row", "romanian_deadlift", "plank"] },
    { id: "gym_push", name: "Upper push", note: "Chest, shoulders, triceps", tone: "pink", items: ["db_bench_press", "db_shoulder_press", "db_lateral_raise", "tricep_pushdown"] },
    { id: "gym_pull", name: "Upper pull", note: "Back and biceps", tone: "sky", items: ["lat_pulldown", "bent_over_row", "db_curl", "superman"] },
    { id: "gym_legs", name: "Legs and glutes", note: "Squat, hinge, lunge", tone: "orange", items: ["barbell_back_squat", "romanian_deadlift", "db_lunge", "hip_thrust", "calf_raise"] },
    { id: "gym_beginner", name: "First week at the gym", note: "Simple machines and dumbbells", tone: "lime", items: ["goblet_squat", "lat_pulldown", "db_shoulder_press", "db_curl", "tricep_pushdown"] },
  ],
};
