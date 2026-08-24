import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type {
  User, Complaint, SickDietRequest, MessMenu, Suggestion,
  Rebate, Pass, Role, Bhawan, Category, AppState,
  ComplaintStatus, PassType, MealType, SuggestionStatus, RebateStatus, PassStatus, SickDietStatus,
  Notice, GroupMessage,
} from "./types";
import { CATEGORY_TO_ROLE, BHAWANS, ALL_CATEGORIES } from "./types";

const STORAGE_KEY = "iitr-hms-v5";
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function uid(prefix: string, n: number): string {
  return `${prefix}-${String(n).padStart(3, "0")}`;
}

function nowISO(): string { return new Date().toISOString(); }

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3600000).toISOString();
}

function genMockData(): AppState {
  let next = 1;
  const n = () => next++;

  const users: User[] = [
    { id: uid("u", n()), name: "Aarav Mehta", email: "aarav.m@iitr.ac.in", role: "Student", bhawan: "Ravindra", roomNo: "B-201", enrollmentNumber: "23114012", enrollmentYear: 2023, branchCode: 114, branchName: "Computer Science & Engineering", academicYear: 3, isVerified: true },
    { id: uid("u", n()), name: "Priya Sharma", email: "priya.s@iitr.ac.in", role: "Student", bhawan: "Ravindra", roomNo: "B-205", enrollmentNumber: "23115033", enrollmentYear: 2023, branchCode: 115, branchName: "Electrical Engineering", academicYear: 3, isVerified: true },
    { id: uid("u", n()), name: "Rohan Verma", email: "rohan.v@iitr.ac.in", role: "Student", bhawan: "Govind", roomNo: "A-112", enrollmentNumber: "24117021", enrollmentYear: 2024, branchCode: 117, branchName: "Mechanical Engineering", academicYear: 2, isVerified: true },
    { id: uid("u", n()), name: "Ananya Singh", email: "ananya.s@iitr.ac.in", role: "Student", bhawan: "Cautley", roomNo: "C-301", enrollmentNumber: "23323008", enrollmentYear: 2023, branchCode: 323, branchName: "Mathematics and Computing", academicYear: 3, isVerified: true },
    { id: uid("u", n()), name: "Karthik Nair", email: "karthik.n@iitr.ac.in", role: "Student", bhawan: "Rajendra", roomNo: "A-105", enrollmentNumber: "22116045", enrollmentYear: 2022, branchCode: 116, branchName: "Electronics & Communication Engineering", academicYear: 4, isVerified: true },
    { id: uid("u", n()), name: "Meera Iyer", email: "meera.i@iitr.ac.in", role: "Student", bhawan: "Sarojini", roomNo: "B-401", enrollmentNumber: "23112019", enrollmentYear: 2023, branchCode: 112, branchName: "Chemical Engineering", academicYear: 3, isVerified: true },
    { id: uid("u", n()), name: "Vikram Joshi", email: "vikram.j@iitr.ac.in", role: "Student", bhawan: "Ravindra", roomNo: "A-108", enrollmentNumber: "22113022", enrollmentYear: 2022, branchCode: 113, branchName: "Civil Engineering", academicYear: 4, isVerified: true },
    { id: uid("u", n()), name: "Diya Patel", email: "diya.p@iitr.ac.in", role: "Student", bhawan: "Govind", roomNo: "C-204", enrollmentNumber: "24123010", enrollmentYear: 2024, branchCode: 123, branchName: "Engineering Physics", academicYear: 2, isVerified: true },
    { id: uid("u", n()), name: "Nikhil Gupta", email: "nikhil.g@iitr.ac.in", role: "Student", bhawan: "Rajendra", roomNo: "B-310", enrollmentNumber: "22119007", enrollmentYear: 2022, branchCode: 119, branchName: "Production and Industrial Engineering", academicYear: 4, isVerified: true },
    { id: uid("u", n()), name: "Sakshi Agarwal", email: "sakshi.a@iitr.ac.in", role: "Student", bhawan: "Sarojini", roomNo: "A-202", enrollmentNumber: "24125015", enrollmentYear: 2024, branchCode: 125, branchName: "Data Science and Artificial Intelligence", academicYear: 2, isVerified: true },
    { id: uid("u", n()), name: "Aditya Tiwari", email: "aditya.t@iitr.ac.in", role: "MessSec", bhawan: "Ravindra", roomNo: "A-101", enrollmentNumber: "22115009", enrollmentYear: 2022, branchCode: 115, branchName: "Electrical Engineering", academicYear: 4, isVerified: true },
    { id: uid("u", n()), name: "Raj Kumar", email: "raj.k@iitr.ac.in", role: "MaintSec", bhawan: "Govind", roomNo: "B-102", enrollmentNumber: "23113014", enrollmentYear: 2023, branchCode: 113, branchName: "Civil Engineering", academicYear: 3, isVerified: true },
    { id: uid("u", n()), name: "Shreya Bose", email: "shreya.b@iitr.ac.in", role: "GenSec", bhawan: "Cautley", roomNo: "A-201", enrollmentNumber: "22114005", enrollmentYear: 2022, branchCode: 114, branchName: "Computer Science & Engineering", academicYear: 4, isVerified: true },
    { id: uid("u", n()), name: "Tushar Malhotra", email: "tushar.m@iitr.ac.in", role: "SportsSec", bhawan: "Rajendra", roomNo: "C-103", enrollmentNumber: "24117031", enrollmentYear: 2024, branchCode: 117, branchName: "Mechanical Engineering", academicYear: 2, isVerified: true },
    { id: uid("u", n()), name: "Nandini Reddy", email: "nandini.r@iitr.ac.in", role: "WellnessSec", bhawan: "Sarojini", roomNo: "B-301", enrollmentNumber: "23124011", enrollmentYear: 2023, branchCode: 124, branchName: "Biosciences and Bioengineering", academicYear: 3, isVerified: true },
    { id: uid("u", n()), name: "Arjun Deshpande", email: "arjun.d@iitr.ac.in", role: "TechSec", bhawan: "Ravindra", roomNo: "C-401", enrollmentNumber: "23125018", enrollmentYear: 2023, branchCode: 125, branchName: "Data Science and Artificial Intelligence", academicYear: 3, isVerified: true },
    { id: uid("u", n()), name: "Pooja Saxena", email: "pooja.s@iitr.ac.in", role: "AsstWarden", bhawan: "Ravindra", roomNo: "W-1", isVerified: true },
    { id: uid("u", n()), name: "Prof. Harish Chandra", email: "harish.c@iitr.ac.in", role: "Warden", bhawan: "Ravindra", roomNo: "W-0", isVerified: true },
  ];

  // Find a user by role (any Bhawan) — every role exists exactly once.
  const sys = (r: Role) => users.find((u) => u.role === r)!;

  const complaints: Complaint[] = [
    {
      id: uid("c", n()), authorId: users[0].id, bhawan: "Ravindra", category: "Mess",
      title: "Dal served cold and undercooked",
      description: "Today's lunch dal was visibly undercooked and served lukewarm. Many students couldn't eat it.",
      assignedRole: "MessSec", status: "Pending", createdAt: hoursAgo(26), updatedAt: hoursAgo(26), isOverdue: true,
      comments: [{ author: sys("MessSec").name, text: "Checked with mess vendor, they'll prepare fresh batch.", date: hoursAgo(20) }],
    },
    {
      id: uid("c", n()), authorId: users[1].id, bhawan: "Ravindra", category: "Maintenance",
      title: "Hot water not available in Block B",
      description: "No hot water in the geyser since yesterday morning. Winter is setting in.",
      assignedRole: "MaintSec", status: "Under Progress", createdAt: hoursAgo(48), updatedAt: hoursAgo(6), isOverdue: false,
      comments: [
        { author: sys("MaintSec").name, text: "Plumber has been called, expected tomorrow.", date: hoursAgo(5) },
      ],
    },
    {
      id: uid("c", n()), authorId: users[2].id, bhawan: "Govind", category: "General",
      title: "Common room TV not working",
      description: "The TV in the common room has a blank screen. Was working fine two days ago.",
      assignedRole: "GenSec", status: "Pending", createdAt: hoursAgo(30), updatedAt: hoursAgo(30), isOverdue: true,
      comments: [],
    },
    {
      id: uid("c", n()), authorId: users[3].id, bhawan: "Cautley", category: "Sports",
      title: "Gym treadmill belt damaged",
      description: "The second treadmill from the left has a torn belt. Risk of injury.",
      assignedRole: "SportsSec", status: "Resolved", createdAt: hoursAgo(120), updatedAt: hoursAgo(72), isOverdue: false,
      comments: [{ author: sys("SportsSec").name, text: "Replaced the belt. Fully operational now.", date: hoursAgo(73) }],
    },
    {
      id: uid("c", n()), authorId: users[4].id, bhawan: "Rajendra", category: "Wellness",
      title: "Dispensary out of basic medicines",
      description: "Paracetamol and ORS sachets have been out of stock for a week.",
      assignedRole: "WellnessSec", status: "Under Progress", createdAt: hoursAgo(50), updatedAt: hoursAgo(24), isOverdue: false,
      comments: [{ author: sys("WellnessSec").name, text: "Raised order to health centre. Expecting stock by Thursday.", date: hoursAgo(23) }],
    },
    {
      id: uid("c", n()), authorId: users[5].id, bhawan: "Sarojini", category: "Technical",
      title: "3rd floor Wi-Fi dead zone",
      description: "No signal on the entire east wing of the 3rd floor. Affects ~30 rooms.",
      assignedRole: "TechSec", status: "Pending", createdAt: hoursAgo(36), updatedAt: hoursAgo(36), isOverdue: true,
      comments: [],
    },
    {
      id: uid("c", n()), authorId: users[6].id, bhawan: "Ravindra", category: "Mess",
      title: "Request for late dinner option during exams",
      description: "Exam schedule runs till 9 PM. Would appreciate mess remaining open till 10 PM.",
      assignedRole: "MessSec", status: "Under Progress", createdAt: hoursAgo(200), updatedAt: hoursAgo(48), isOverdue: false,
      comments: [
        { author: sys("MessSec").name, text: "Discussed with warden. Temporary extension approved during exam weeks.", date: hoursAgo(47) },
      ],
    },
    {
      id: uid("c", n()), authorId: users[7].id, bhawan: "Govind", category: "Maintenance",
      title: "Leaking pipe under sink in room A-112",
      description: "Water pooling under the washbasin. Already damaged the floor.",
      assignedRole: "MaintSec", status: "Resolved", createdAt: hoursAgo(160), updatedAt: hoursAgo(100), isOverdue: false,
      comments: [{ author: sys("MaintSec").name, text: "Pipe repaired and area cleaned.", date: hoursAgo(101) }],
    },
    {
      id: uid("c", n()), authorId: users[8].id, bhawan: "Rajendra", category: "General",
      title: "Laundry service not picking up clothes",
      description: "Weekly laundry collection has been skipped twice in a row.",
      assignedRole: "GenSec", status: "Pending", createdAt: hoursAgo(20), updatedAt: hoursAgo(20), isOverdue: false,
      comments: [],
    },
    {
      id: uid("c", n()), authorId: users[9].id, bhawan: "Sarojini", category: "Wellness",
      title: "Mental health awareness session request",
      description: "Students have been requesting more stress management workshops before end-sem exams.",
      assignedRole: "WellnessSec", status: "Pending", createdAt: hoursAgo(10), updatedAt: hoursAgo(10), isOverdue: false,
      comments: [],
    },
    {
      id: uid("c", n()), authorId: users[10].id, bhawan: "Ravindra", category: "Mess",
      title: "Sandwiched between two delays — follow-up on cold food complaint",
      description: "The earlier complaint about cold dal was not properly addressed. Food quality has not improved.",
      assignedRole: "MessSec", status: "Under Progress", createdAt: hoursAgo(12), updatedAt: hoursAgo(3), isOverdue: false,
      comments: [{ author: sys("MessSec").name, text: "Vendor warned formally. Menu rotation adjusted for this week.", date: hoursAgo(2) }],
    },
    {
      id: uid("c", n()), authorId: users[4].id, bhawan: "Rajendra", category: "Sports",
      title: "Badminton court nets torn",
      description: "Two of the four courts have damaged nets. Shuttlecocks fly through.",
      assignedRole: "SportsSec", status: "Cannot Resolve", createdAt: hoursAgo(240), updatedAt: hoursAgo(168), isOverdue: false,
      comments: [{ author: sys("SportsSec").name, text: "Budget constraints — new nets ordered through sports council, expected next month.", date: hoursAgo(169) }],
    },
  ];

  const sickDietRequests: SickDietRequest[] = [
    {
      id: uid("sd", n()), studentId: users[0].id, roomNo: "B-201", bhawan: "Ravindra",
      date: new Date().toISOString().slice(0, 10), mealType: "Dinner", message: "Running a fever. Need light khichdi please.",
      status: "Requested", notifiedRoles: ["MessSec", "WellnessSec"],
    },
    {
      id: uid("sd", n()), studentId: users[2].id, roomNo: "A-112", bhawan: "Govind",
      date: new Date().toISOString().slice(0, 10), mealType: "Lunch", message: "Recovering from food poisoning. Need dalia.",
      medicalProofUrl: "slip_112.pdf", status: "In Preparation", notifiedRoles: ["MessSec", "WellnessSec"],
    },
    {
      id: uid("sd", n()), studentId: users[6].id, roomNo: "A-108", bhawan: "Ravindra",
      date: new Date(Date.now() + 86400000).toISOString().slice(0, 10), mealType: "Breakfast", message: "Sore throat — need warm porridge.",
      status: "Requested", notifiedRoles: ["MessSec"],
    },
    {
      id: uid("sd", n()), studentId: users[5].id, roomNo: "B-401", bhawan: "Sarojini",
      date: new Date().toISOString().slice(0, 10), mealType: "Dinner", message: "Stomach upset. Khichdi with curd please.",
      status: "Delivered", deliveredBy: sys("MessSec").name, notifiedRoles: ["MessSec", "WellnessSec"],
    },
  ];

  const messMenus: MessMenu[] = (() => {
    const menus: MessMenu[] = [];
    const breakfastItems = [
      "Poha, Boiled Eggs, Toast & Butter, Tea/Coffee",
      "Idli Sambar, Vada, Chutney, Fruit Juice",
      "Paratha with Curd & Pickle, Boiled Egg, Milk",
      "Upma, Bread Pakora, Banana, Tea",
      "Chole Bhature, Raita, Banana, Milk",
      "Aloo Tikki, Sprouts Chaat, Toast, Juice",
      "Masala Omelette, Paratha, Cut Fruit, Coffee",
    ];
    const lunchItems = [
      "Rice, Dal Fry, Aloo Gobi, Salad, Curd",
      "Rice, Chole, Bhindi, Chapati, Papad",
      "Rice, Rajma, Paneer Butter Masala, Raita",
      "Rice, Sambar, Rasam, Vegetable Dry, Pickle",
      "Biryani, Mirchi ka Salan, Raita",
      "Rice, Dal Makhani, Mixed Veg, Salad",
      "Special Thali: Rice, Dal, 2 Sabzi, Chapati, Sweet",
    ];
    const dinnerItems = [
      "Rice, Dal, Chapati, Aloo Matar, Salad",
      "Rice, Kadhi Pakora, Jeera Aloo, Curd",
      "Rice, Dal Tadka, Shimla Mirch, Chapati",
      "Pasta / Noodles Station, Garlic Bread, Soup",
      "Rice, Egg Curry, Chapati, Cabbage, Salad",
      "Rice, Dal, Chapati, Paneer Bhurji, Raita",
      "Rice, Chicken/Paneer Curry, Chapati, Sweet",
    ];
    for (let bhawan of BHAWANS) {
      for (let day = 0; day < 7; day++) {
        menus.push({ bhawan, dayOfWeek: day, mealType: "Breakfast", menuDetails: breakfastItems[day] });
        menus.push({ bhawan, dayOfWeek: day, mealType: "Lunch", menuDetails: lunchItems[day], noticeText: day === 5 ? "🎉 Sanjhi Khushi — Special Biryani Today!" : undefined });
        menus.push({ bhawan, dayOfWeek: day, mealType: "Dinner", menuDetails: dinnerItems[day] });
      }
    }
    return menus;
  })();

  const suggestions: Suggestion[] = [
    {
      id: uid("sg", n()), authorId: users[0].id, bhawan: "Ravindra", category: "General",
      title: "24/7 study room in every bhawan",
      description: "Exam season makes library crowded. A small 24-hour study room with AC and Wi-Fi in each bhawan would help immensely.",
      upvotedBy: [users[1].id, users[2].id, users[4].id, users[6].id, users[8].id], downvotedBy: [],
      status: "Under Review",
      wardenFeedback: "Interesting proposal. We're evaluating space availability.", createdAt: hoursAgo(200),
      comments: [
        { id: "c-101", authorId: users[2].id, authorName: users[2].name, text: "Library is absolutely packed during exams — this would help a lot.", createdAt: hoursAgo(190), parentId: null, upvotedBy: [users[0].id, users[1].id], downvotedBy: [] },
        { id: "c-102", authorId: users[0].id, authorName: users[0].name, text: "Exactly! Even the reading room has a queue after 8 PM.", createdAt: hoursAgo(180), parentId: "c-101", upvotedBy: [users[2].id], downvotedBy: [] },
        { id: "c-103", authorId: users[6].id, authorName: users[6].name, text: "Please add one in Ravindra A-block, it's closest to my room 🙏", createdAt: hoursAgo(150), parentId: null, upvotedBy: [], downvotedBy: [] },
      ],
    },
    {
      id: uid("sg", n()), authorId: users[2].id, bhawan: "Govind", category: "Mess",
      title: "Late night maggi / cup noodle counter",
      description: "A small counter serving maggi and cup noodles from 10 PM to 1 AM would be a lifesaver during deadline weeks.",
      upvotedBy: [users[0].id, users[3].id, users[5].id, users[7].id, users[9].id, users[1].id, users[4].id], downvotedBy: [users[8].id],
      status: "Open", createdAt: hoursAgo(150),
      comments: [
        { id: "c-201", authorId: users[5].id, authorName: users[5].name, text: "Cheese maggi at 11 PM would fix 90% of my problems.", createdAt: hoursAgo(140), parentId: null, upvotedBy: [users[2].id, users[0].id], downvotedBy: [] },
        { id: "c-202", authorId: users[8].id, authorName: users[8].name, text: "Who's paying for the gas and the guy running it at 1 AM?", createdAt: hoursAgo(120), parentId: null, upvotedBy: [], downvotedBy: [users[2].id] },
        { id: "c-203", authorId: users[2].id, authorName: users[2].name, text: "Mess secy said a small monthly add-on could cover it — discussing with warden.", createdAt: hoursAgo(110), parentId: "c-202", upvotedBy: [users[5].id], downvotedBy: [] },
      ],
    },
    {
      id: uid("sg", n()), authorId: users[5].id, bhawan: "Sarojini", category: "Sports",
      title: "Outdoor basketball court resurfacing",
      description: "The outdoor court is cracked and slippery when wet. Needs urgent resurfacing before someone gets hurt.",
      upvotedBy: [users[4].id, users[8].id, users[1].id], downvotedBy: [],
      status: "Approved", createdAt: hoursAgo(300),
      wardenFeedback: "Approved. Work orders raised with sports council. Expected completion: next semester.",
      comments: [],
    },
    {
      id: uid("sg", n()), authorId: users[3].id, bhawan: "Cautley", category: "Wellness",
      title: "Monthly mental health check-in by counselor",
      description: "One in-person counselor visit per month per bhawan would help students deal with academic pressure before it builds up.",
      upvotedBy: [users[0].id, users[2].id, users[6].id, users[9].id, users[1].id], downvotedBy: [],
      status: "Open", createdAt: hoursAgo(100),
      comments: [
        { id: "c-301", authorId: users[9].id, authorName: users[9].name, text: "Strongly support this. Even a quarterly session would be a start.", createdAt: hoursAgo(90), parentId: null, upvotedBy: [users[3].id], downvotedBy: [] },
      ],
    },
    {
      id: uid("sg", n()), authorId: users[8].id, bhawan: "Rajendra", category: "Technical",
      title: "Fix portal login bugs before placement season",
      description: "The hostel portal crashes during peak hours. With placements starting, we need reliable access.",
      upvotedBy: [users[0].id, users[1].id, users[5].id, users[3].id, users[6].id, users[7].id, users[9].id], downvotedBy: [],
      status: "Implemented",
      wardenFeedback: "Fixed. Server capacity increased and caching implemented.", createdAt: hoursAgo(400),
      comments: [
        { id: "c-401", authorId: users[5].id, authorName: users[5].name, text: "Can confirm it's much faster now. Thanks for the quick fix!", createdAt: hoursAgo(350), parentId: null, upvotedBy: [users[8].id], downvotedBy: [] },
      ],
    },
  ];

  const rebates: Rebate[] = [
    {
      id: uid("rb", n()), studentId: users[0].id, startDate: "2026-09-01", endDate: "2026-09-05", totalDays: 5, totalMeals: 15,
      status: "Approved", submittedAt: hoursAgo(400),
    },
    {
      id: uid("rb", n()), studentId: users[3].id, startDate: "2026-09-10", endDate: "2026-09-20", totalDays: 11, totalMeals: 33,
      status: "Pending", submittedAt: hoursAgo(50),
    },
    {
      id: uid("rb", n()), studentId: users[5].id, startDate: "2026-08-15", endDate: "2026-08-18", totalDays: 4, totalMeals: 12,
      status: "Rejected", submittedAt: hoursAgo(600),
    },
  ];

  const passes: Pass[] = [
    {
      id: uid("p", n()), studentId: users[0].id, studentName: users[0].name, passType: "LateEntry",
      reason: "Coming back from IEEE conference. Train arrives at 11:45 PM.",
      validDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10), status: "Pending", createdAt: hoursAgo(5),
    },
    {
      id: uid("p", n()), studentId: users[2].id, studentName: users[2].name, passType: "SportsGear",
      reason: "Need cricket bat and ball for inter-bhawan tournament practice.",
      validDate: new Date().toISOString().slice(0, 10), status: "Approved", approvedBy: sys("SportsSec").name, createdAt: hoursAgo(48),
    },
    {
      id: uid("p", n()), studentId: users[4].id, studentName: users[4].name, passType: "GuestStay",
      reason: "Parents visiting for campus placement week.",
      validDate: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10), status: "Pending", createdAt: hoursAgo(12),
    },
    {
      id: uid("p", n()), studentId: users[6].id, studentName: users[6].name, passType: "LateEntry",
      reason: "Attending fests in Dehradun. Last bus at 10 PM.",
      validDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10), status: "Approved", approvedBy: sys("AsstWarden").name, createdAt: hoursAgo(24),
    },
  ];

  const specialAnnouncements = [
    "🎉 Sanjhi Khushi Menu tonight: Veg Biryani, Raita, Gulab Jamun",
    "📢 Water tank maintenance on Sunday 6 AM–10 AM. Store water in advance.",
    "🏏 Inter-Bhawan Cricket Tournament starts next Monday. Register with your GenSec.",
  ];

  const joinedBy: Record<string, string[]> = {
    [users[0].id]: ["Mess", "General", "Technical"],
    [users[2].id]: ["Technical", "General", "Mess"],
    [users[5].id]: ["Wellness", "Sports"],
    [users[8].id]: ["Technical"],
  };

  const notices: Notice[] = [
    {
      id: uid("nt", n()), authorId: users[17].id, bhawan: "Ravindra",
      title: "Water Tank Maintenance — Sunday 6 AM to 10 AM",
      body: "The overhead tank will be cleaned and serviced this Sunday. Please store sufficient water on Saturday night. Sorry for the inconvenience.",
      pinned: true, createdAt: hoursAgo(8),
    },
    {
      id: uid("nt", n()), authorId: users[16].id, bhawan: "Ravindra",
      title: "Wi-Fi Upgrade Scheduled — Thursday Night",
      body: "Bandwidth will increase from 100 Mbps to 1 Gbps per floor. Expect a 30-minute outage between 11 PM and 12 AM on Thursday.",
      pinned: false, createdAt: hoursAgo(48),
    },
    {
      id: uid("nt", n()), authorId: users[17].id, bhawan: "Ravindra",
      title: "Mid-Sem Exam Mess Timings Extended",
      body: "During mid-sem exams (Sep 15–25), dinner will be served till 10:30 PM. Please carry your ID card.",
      pinned: false, createdAt: hoursAgo(120),
    },
  ];

  const groupMessages: GroupMessage[] = [
    {
      id: uid("gm", n()), authorId: users[17].id,
      text: "Team, let's discuss the upcoming Parents' Day logistics. MessSec, can you prepare the catering plan?",
      createdAt: hoursAgo(6),
    },
    {
      id: uid("gm", n()), authorId: users[10].id,
      text: "Sure, Prof. Chandra. I'll have the menu ready by tomorrow. Should we keep it vegetarian-only?",
      createdAt: hoursAgo(5),
    },
    {
      id: uid("gm", n()), authorId: users[16].id,
      text: "I'll handle the Wi-Fi setup for the guest area. Need 2 access points near the auditorium.",
      createdAt: hoursAgo(4),
    },
    {
      id: uid("gm", n()), authorId: users[11].id,
      text: "Geyser repair in Block C is done. 12 rooms affected, all working now.",
      createdAt: hoursAgo(3),
    },
    {
      id: uid("gm", n()), authorId: users[15].id,
      text: "Reminder: Sports council meeting at 4 PM today. Tushar, you joining?",
      createdAt: hoursAgo(2),
    },
  ];

  return {
    users, complaints, sickDietRequests, messMenus, suggestions, rebates, passes,
    specialAnnouncements, joinedBy, notices, groupMessages, currentUserId: users[0].id, nextId: next + 100,
  };
}

// ─── Context ───────────────────────────────────────────────────────────────────

interface StoreContextType extends AppState {
  currentUser: User;
  switchUser: (userId: string) => void;
  switchByEmail: (email: string) => void;
  genId: (prefix: string) => string;
  completeOnboarding: (data: {
    name: string; enrollmentNumber: string; enrollmentYear: number;
    branchCode: number; branchName: string; academicYear: number;
    bhawan: Bhawan; roomNo: string;
  }) => void;

  addComplaint: (c: Omit<Complaint, "id" | "createdAt" | "updatedAt" | "isOverdue" | "comments" | "assignedRole">) => void;
  updateComplaintStatus: (id: string, status: ComplaintStatus, note?: string) => void;
  reassignComplaint: (id: string, newCategory: Category) => void;
  addComplaintComment: (id: string, text: string) => void;

  addSickDietRequest: (r: Omit<SickDietRequest, "id" | "status" | "deliveredBy" | "notifiedRoles">) => void;
  updateSickDietStatus: (id: string, status: SickDietStatus, deliveredBy?: string) => void;

  addSuggestion: (s: Omit<Suggestion, "id" | "upvotedBy" | "downvotedBy" | "status" | "createdAt" | "comments">) => void;
  voteSuggestion: (id: string, dir: "up" | "down") => void;
  addSuggestionComment: (suggestionId: string, text: string, parentId?: string | null) => void;
  voteComment: (suggestionId: string, commentId: string, dir: "up" | "down") => void;
  toggleJoin: (communityId: string) => void;
  updateSuggestionStatus: (id: string, status: SuggestionStatus, feedback?: string) => void;

  addRebate: (r: Omit<Rebate, "id" | "status" | "submittedAt">) => void;
  updateRebateStatus: (id: string, status: RebateStatus) => void;

  addPass: (p: Omit<Pass, "id" | "status" | "approvedBy" | "createdAt">) => void;
  updatePassStatus: (id: string, status: PassStatus, approvedBy?: string) => void;

  // ── Admin ──
  assignRole: (userId: string, newRole: Role, newBhawan?: Bhawan) => void;
  revokeRole: (userId: string) => void;
  addUser: (data: { name: string; email: string; role: Role; bhawan: Bhawan; roomNo: string }) => void;

  // ── Notices ──
  addNotice: (n: Omit<Notice, "id" | "createdAt">) => void;
  deleteNotice: (id: string) => void;

  // ── Group Chat ──
  sendGroupMessage: (text: string) => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Ensure new fields exist for old localStorage data
        return {
          ...parsed,
          notices: parsed.notices ?? [],
          groupMessages: parsed.groupMessages ?? [],
        };
      }
    } catch {}
    const fresh = genMockData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    return fresh;
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const currentUser = state.users.find((u) => u.id === state.currentUserId) ?? state.users[0];

  const genId = useCallback((prefix: string) => {
    let id = 0;
    setState((s) => { id = s.nextId; return { ...s, nextId: s.nextId + 1 }; });
    return uid(prefix, id);
  }, []);

  const switchUser = useCallback((userId: string) => {
    setState((s) => ({ ...s, currentUserId: userId }));
  }, []);

  const switchByEmail = useCallback((email: string) => {
    setState((s) => {
      const match = s.users.find((u) => u.email === email);
      if (match) return { ...s, currentUserId: match.id };
      // New sign-in → unverified until onboarding completes
      const newUser: User = {
        id: uid("u", s.nextId), name: email.split("@")[0], email,
        role: "Student", bhawan: "Ravindra", roomNo: "A-000",
        isVerified: false,
      };
      return { ...s, users: [...s.users, newUser], currentUserId: newUser.id, nextId: s.nextId + 1 };
    });
  }, []);

  /** Onboarding gate: persist verified academic identity. */
  const completeOnboarding = useCallback((data: {
    name: string; enrollmentNumber: string; enrollmentYear: number;
    branchCode: number; branchName: string; academicYear: number;
    bhawan: Bhawan; roomNo: string;
  }) => {
    setState((s) => ({
      ...s,
      users: s.users.map((u) =>
        u.id === s.currentUserId
          ? {
              ...u,
              name: data.name,
              enrollmentNumber: data.enrollmentNumber,
              enrollmentYear: data.enrollmentYear,
              branchCode: data.branchCode,
              branchName: data.branchName,
              academicYear: data.academicYear,
              bhawan: data.bhawan,
              roomNo: data.roomNo,
              isVerified: true,
            }
          : u,
      ),
    }));
  }, []);

  const patch = useCallback((updater: (s: AppState) => AppState) => {
    setState((s) => updater(s));
  }, []);

  // ─── Complaints ────────────────────────────────────────────────────────────
  const addComplaint: StoreContextType["addComplaint"] = useCallback((data) => {
    const role = CATEGORY_TO_ROLE[data.category];
    patch((s) => ({
      ...s,
      complaints: [
        {
          ...data,
          id: uid("c", s.nextId), assignedRole: role, status: "Pending",
          createdAt: nowISO(), updatedAt: nowISO(), isOverdue: false, comments: [],
        },
        ...s.complaints,
      ],
      nextId: s.nextId + 1,
    }));
  }, [patch]);

  const updateComplaintStatus: StoreContextType["updateComplaintStatus"] = useCallback((id, status, note) => {
    patch((s) => ({
      ...s,
      complaints: s.complaints.map((c) =>
        c.id === id
          ? {
              ...c, status, updatedAt: nowISO(),
              comments: note
                ? [...c.comments, { author: s.users.find((u) => u.id === s.currentUserId)?.name ?? "Unknown", text: note, date: nowISO() }]
                : c.comments,
            }
          : c,
      ),
    }));
  }, [patch]);

  const reassignComplaint: StoreContextType["reassignComplaint"] = useCallback((id, newCategory) => {
    const newRole = CATEGORY_TO_ROLE[newCategory];
    patch((s) => ({
      ...s,
      complaints: s.complaints.map((c) =>
        c.id === id
          ? { ...c, category: newCategory, assignedRole: newRole, status: "Pending" as const, updatedAt: nowISO() }
          : c,
      ),
    }));
  }, [patch]);

  const addComplaintComment: StoreContextType["addComplaintComment"] = useCallback((id, text) => {
    patch((s) => ({
      ...s,
      complaints: s.complaints.map((c) =>
        c.id === id
          ? {
              ...c, updatedAt: nowISO(),
              comments: [...c.comments, { author: s.users.find((u) => u.id === s.currentUserId)?.name ?? "Unknown", text, date: nowISO(), authorRole: s.users.find((u) => u.id === s.currentUserId)?.role }],
            }
          : c,
      ),
    }));
  }, [patch]);

  // ─── Sick Diet ─────────────────────────────────────────────────────────────
  const addSickDietRequest: StoreContextType["addSickDietRequest"] = useCallback((data) => {
    patch((s) => ({
      ...s,
      sickDietRequests: [
        { ...data, id: uid("sd", s.nextId), status: "Requested" as const, notifiedRoles: ["MessSec", "WellnessSec"] },
        ...s.sickDietRequests,
      ],
      nextId: s.nextId + 1,
    }));
  }, [patch]);

  const updateSickDietStatus: StoreContextType["updateSickDietStatus"] = useCallback((id, status, deliveredBy) => {
    patch((s) => ({
      ...s,
      sickDietRequests: s.sickDietRequests.map((r) =>
        r.id === id ? { ...r, status, deliveredBy: deliveredBy ?? r.deliveredBy } : r,
      ),
    }));
  }, [patch]);

  // ─── Suggestions / Community (Reddit-style) ─────────────────────────────
  const addSuggestion: StoreContextType["addSuggestion"] = useCallback((data) => {
    patch((s) => ({
      ...s,
      suggestions: [
        {
          ...data, id: uid("sg", s.nextId),
          upvotedBy: [s.currentUserId], downvotedBy: [],
          status: "Open" as const, createdAt: nowISO(), comments: [],
        },
        ...s.suggestions,
      ],
      nextId: s.nextId + 1,
    }));
  }, [patch]);

  /** Reddit vote semantics: up→down switches, clicking active vote clears it. */
  const voteSuggestion: StoreContextType["voteSuggestion"] = useCallback((id, dir) => {
    patch((s) => ({
      ...s,
      suggestions: s.suggestions.map((sg) => {
        if (sg.id !== id) return sg;
        const me = s.currentUserId;
        const up = sg.upvotedBy.includes(me);
        const down = sg.downvotedBy.includes(me);
        if (dir === "up") {
          return down
            ? { ...sg, downvotedBy: sg.downvotedBy.filter((u) => u !== me), upvotedBy: [...sg.upvotedBy, me] }
            : up
              ? { ...sg, upvotedBy: sg.upvotedBy.filter((u) => u !== me) }
              : { ...sg, upvotedBy: [...sg.upvotedBy, me] };
        }
        return up
          ? { ...sg, upvotedBy: sg.upvotedBy.filter((u) => u !== me), downvotedBy: [...sg.downvotedBy, me] }
          : down
            ? { ...sg, downvotedBy: sg.downvotedBy.filter((u) => u !== me) }
            : { ...sg, downvotedBy: [...sg.downvotedBy, me] };
      }),
    }));
  }, [patch]);

  const addSuggestionComment: StoreContextType["addSuggestionComment"] = useCallback((suggestionId, text, parentId = null) => {
    patch((s) => {
      const me = s.users.find((u) => u.id === s.currentUserId);
      const comment = {
        id: `c-${s.nextId}`, authorId: s.currentUserId,
        authorName: me?.name ?? "Unknown", text: text.trim(),
        createdAt: nowISO(), parentId: parentId ?? null,
        upvotedBy: [s.currentUserId], downvotedBy: [],
      };
      return {
        ...s,
        suggestions: s.suggestions.map((sg) =>
          sg.id === suggestionId ? { ...sg, comments: [...sg.comments, comment] } : sg,
        ),
        nextId: s.nextId + 1,
      };
    });
  }, [patch]);

  const voteComment: StoreContextType["voteComment"] = useCallback((suggestionId, commentId, dir) => {
    patch((s) => ({
      ...s,
      suggestions: s.suggestions.map((sg) => {
        if (sg.id !== suggestionId) return sg;
        const me = s.currentUserId;
        return {
          ...sg,
          comments: sg.comments.map((c) => {
            if (c.id !== commentId) return c;
            const up = c.upvotedBy.includes(me);
            const down = c.downvotedBy.includes(me);
            if (dir === "up") {
              return down
                ? { ...c, downvotedBy: c.downvotedBy.filter((u) => u !== me), upvotedBy: [...c.upvotedBy, me] }
                : up
                  ? { ...c, upvotedBy: c.upvotedBy.filter((u) => u !== me) }
                  : { ...c, upvotedBy: [...c.upvotedBy, me] };
            }
            return up
              ? { ...c, upvotedBy: c.upvotedBy.filter((u) => u !== me), downvotedBy: [...c.downvotedBy, me] }
              : down
                ? { ...c, downvotedBy: c.downvotedBy.filter((u) => u !== me) }
                : { ...c, downvotedBy: [...c.downvotedBy, me] };
          }),
        };
      }),
    }));
  }, [patch]);

  const toggleJoin: StoreContextType["toggleJoin"] = useCallback((communityId) => {
    patch((s) => {
      const mine = s.joinedBy[s.currentUserId] ?? [];
      return {
        ...s,
        joinedBy: {
          ...s.joinedBy,
          [s.currentUserId]: mine.includes(communityId)
            ? mine.filter((c) => c !== communityId)
            : [...mine, communityId],
        },
      };
    });
  }, [patch]);

  const updateSuggestionStatus: StoreContextType["updateSuggestionStatus"] = useCallback((id, status, feedback) => {
    patch((s) => ({
      ...s,
      suggestions: s.suggestions.map((sg) =>
        sg.id === id ? { ...sg, status, wardenFeedback: feedback ?? sg.wardenFeedback } : sg,
      ),
    }));
  }, [patch]);

  // ─── Rebates ───────────────────────────────────────────────────────────────
  const addRebate: StoreContextType["addRebate"] = useCallback((data) => {
    patch((s) => ({
      ...s,
      rebates: [{ ...data, id: uid("rb", s.nextId), status: "Pending" as const, submittedAt: nowISO() }, ...s.rebates],
      nextId: s.nextId + 1,
    }));
  }, [patch]);

  const updateRebateStatus: StoreContextType["updateRebateStatus"] = useCallback((id, status) => {
    patch((s) => ({
      ...s,
      rebates: s.rebates.map((r) => (r.id === id ? { ...r, status } : r)),
    }));
  }, [patch]);

  // ─── Passes ────────────────────────────────────────────────────────────────
  const addPass: StoreContextType["addPass"] = useCallback((data) => {
    patch((s) => ({
      ...s,
      passes: [{ ...data, id: uid("p", s.nextId), status: "Pending" as const, createdAt: nowISO() }, ...s.passes],
      nextId: s.nextId + 1,
    }));
  }, [patch]);

  const updatePassStatus: StoreContextType["updatePassStatus"] = useCallback((id, status, approvedBy) => {
    patch((s) => ({
      ...s,
      passes: s.passes.map((p) =>
        p.id === id ? { ...p, status, approvedBy: approvedBy ?? p.approvedBy } : p,
      ),
    }));
  }, [patch]);

  // ─── Admin (role management) ──────────────────────────────────────────────
  const assignRole: StoreContextType["assignRole"] = useCallback((userId, newRole, newBhawan) => {
    patch((s) => ({
      ...s,
      users: s.users.map((u) =>
        u.id === userId ? { ...u, role: newRole, ...(newBhawan ? { bhawan: newBhawan } : {}) } : u,
      ),
    }));
  }, [patch]);

  const revokeRole: StoreContextType["revokeRole"] = useCallback((userId) => {
    patch((s) => ({
      ...s,
      users: s.users.map((u) =>
        u.id === userId ? { ...u, role: "Student" as Role } : u,
      ),
    }));
  }, [patch]);

  const addUser: StoreContextType["addUser"] = useCallback((data) => {
    patch((s) => ({
      ...s,
      users: [...s.users, { ...data, id: uid("u", s.nextId), isVerified: true }],
      nextId: s.nextId + 1,
    }));
  }, [patch]);

  // ─── Notices ──────────────────────────────────────────────────────────────
  const addNotice: StoreContextType["addNotice"] = useCallback((data) => {
    patch((s) => ({
      ...s,
      notices: [{ ...data, id: uid("nt", s.nextId), createdAt: nowISO() }, ...s.notices],
      nextId: s.nextId + 1,
    }));
  }, [patch]);

  const deleteNotice: StoreContextType["deleteNotice"] = useCallback((id) => {
    patch((s) => ({
      ...s,
      notices: s.notices.filter((n) => n.id !== id),
    }));
  }, [patch]);

  // ─── Group Chat ───────────────────────────────────────────────────────────
  const sendGroupMessage: StoreContextType["sendGroupMessage"] = useCallback((text) => {
    patch((s) => ({
      ...s,
      groupMessages: [...s.groupMessages, { id: uid("gm", s.nextId), authorId: s.currentUserId, text: text.trim(), createdAt: nowISO() }],
      nextId: s.nextId + 1,
    }));
  }, [patch]);

  return (
    <StoreContext.Provider
      value={{
        ...state, currentUser, switchUser, switchByEmail, genId, completeOnboarding,
        addComplaint, updateComplaintStatus, reassignComplaint, addComplaintComment,
        addSickDietRequest, updateSickDietStatus,
        addSuggestion, voteSuggestion, addSuggestionComment, voteComment, toggleJoin, updateSuggestionStatus,
        addRebate, updateRebateStatus,
        addPass, updatePassStatus,
        assignRole, revokeRole, addUser,
        addNotice, deleteNotice, sendGroupMessage,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): StoreContextType {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
