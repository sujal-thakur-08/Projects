const { useEffect, useMemo, useState } = React;

const INFO_LINKS = [
  { slug: "help-center", label: "Help Center" },
  { slug: "publishing-guide", label: "Lookbook Guide" },
  { slug: "video-tutorials", label: "Video Tutorials" },
  { slug: "terms-of-service", label: "Terms of Service" },
  { slug: "privacy", label: "Privacy" },
  { slug: "content-policy", label: "Content Policy" },
];

const FALLBACK_PAGES = {
  "help-center": {
    slug: "help-center",
    title: "Help Center",
    summary:
      "Find quick answers for orders, sizing, shipping, and account support.",
    sections: [
      {
        heading: "Getting Started",
        body: "Set up your profile and publish your first story in minutes.",
      },
      {
        heading: "Account And Security",
        body: "Update your password, security settings, and trusted devices.",
      },
    ],
  },
  "publishing-guide": {
    slug: "publishing-guide",
    title: "Lookbook Guide",
    summary:
      "Learn how to style, shoot, and publish pieces like a modern digital lookbook.",
    sections: [
      {
        heading: "Drafting",
        body: "Start with a clear promise and outline each section before writing.",
      },
      {
        heading: "Publishing",
        body: "Preview your story on mobile and desktop before publishing.",
      },
    ],
  },
  "video-tutorials": {
    slug: "video-tutorials",
    title: "Video Tutorials",
    summary:
      "Watch practical lessons for layout, writing, and analytics setup.",
    sections: [
      {
        heading: "Beginner",
        body: "Theme setup, first article publishing, and navigation basics.",
      },
      {
        heading: "Advanced",
        body: "Integrations, optimization, and scalable content workflows.",
      },
    ],
  },
  "terms-of-service": {
    slug: "terms-of-service",
    title: "Terms Of Service",
    summary: "The usage rules and responsibilities for this platform.",
    sections: [
      {
        heading: "Acceptable Use",
        body: "Do not publish harmful, deceptive, or unlawful content.",
      },
      {
        heading: "Account Responsibility",
        body: "You are responsible for protecting your account credentials.",
      },
    ],
  },
  privacy: {
    slug: "privacy",
    title: "Privacy",
    summary: "How your data is used, stored, and protected.",
    sections: [
      {
        heading: "Data Collection",
        body: "We collect account and usage data to improve the service.",
      },
      {
        heading: "Your Controls",
        body: "You can request data export or deletion from account settings.",
      },
    ],
  },
  "content-policy": {
    slug: "content-policy",
    title: "Content Policy",
    summary: "Standards for a safe and high-quality publishing environment.",
    sections: [
      {
        heading: "Prohibited Content",
        body: "Harassment, abuse, and misinformation are not allowed.",
      },
      {
        heading: "Enforcement",
        body: "Policy violations can lead to content removal or account limits.",
      },
    ],
  },
};

function parseRouteFromHash(hashValue) {
  const normalizedHash = String(hashValue || "").replace(/^#/, "");

  if (normalizedHash === "/login" || normalizedHash.startsWith("/login/")) {
    return { view: "login", slug: null };
  }

  if (normalizedHash === "/admin" || normalizedHash.startsWith("/admin/")) {
    return { view: "admin", slug: null };
  }

  if (normalizedHash.startsWith("/page/")) {
    const slug = normalizedHash.slice("/page/".length).trim().toLowerCase();
    if (slug) {
      return { view: "page", slug };
    }
  }

  return { view: "home", slug: null };
}

function resolveApiBaseUrl() {
  const configured = typeof window.BLOG_API_URL === "string" ? window.BLOG_API_URL.trim() : "";
  if (configured) {
    return configured.replace(/\/+$/, "");
  }

  const { origin, hostname, port } = window.location;
  const isLocalHost = hostname === "localhost" || hostname === "127.0.0.1";

  if (isLocalHost && port && port !== "4000") {
    return "http://localhost:4000/api";
  }

  return `${origin.replace(/\/+$/, "")}/api`;
}

const FALLBACK_BLOGS = [
  {
    id: 1,
    title: "How To Build A 3-Fit Capsule For College Weeks",
    category: "Style Guides",
    author: "Rhea Collins",
    date: "Apr 1, 2026",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80",
    excerpt:
      "One jacket, one oversized tee, one statement pair of pants. Minimal pieces, maximum outfit combos.",
    content:
      "A smart campus wardrobe starts with repeatable silhouettes. Pick one outer layer that works with everything, then rotate base tees and cargos in neutral tones. Add one loud accessory each day to make the fit feel fresh without buying a full new closet.",
  },
  {
    id: 2,
    title: "The Drop Calendar Playbook For Small Clothing Brands",
    category: "Brand Ops",
    author: "Ishaan Gupta",
    date: "Mar 28, 2026",
    image: "https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=1200&q=80",
    excerpt:
      "A clean system for planning teasers, launch day, and post-drop storytelling without chaos.",
    content:
      "Great drops are paced, not rushed. Use a three-phase cadence: tease, reveal, release. Week one builds intrigue, week two highlights fabrics and fit, and week three is for conversion content plus creator styling clips. This keeps attention steady and improves sell-through.",
  },
  {
    id: 3,
    title: "Streetwear Fit Check: Baggy Vs Relaxed Explained",
    category: "Fit School",
    author: "Maya Lopez",
    date: "Mar 26, 2026",
    image: "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?auto=format&fit=crop&w=1200&q=80",
    excerpt: "The visual difference is subtle, but the vibe is completely different.",
    content:
      "Baggy fit adds volume through the leg and creates a loose, skater-inspired silhouette. Relaxed fit gives extra room while keeping shape cleaner at the hem. Match baggy bottoms with cropped tops for balance; pair relaxed denim with oversized hoodies for daily wear comfort.",
  },
  {
    id: 4,
    title: "Color Theory For Outfits: 3 Safe Pairings That Always Hit",
    category: "Style Guides",
    author: "Liam Chen",
    date: "Mar 21, 2026",
    image: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=80",
    excerpt:
      "Build clean looks faster with pairings that work in photos and in real life.",
    content:
      "Start with tonal neutrals like black, graphite, and stone for an elevated base. Add one highlight color such as cobalt, olive, or rust through sneakers or a cap. Keep logos minimal when colors are loud so the outfit feels intentional instead of busy.",
  },
  {
    id: 5,
    title: "Behind The Scenes: From Fabric Roll To Finished Hoodie",
    category: "Manufacturing",
    author: "Sara West",
    date: "Mar 18, 2026",
    image: "https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?auto=format&fit=crop&w=1200&q=80",
    excerpt:
      "Why GSM, stitch density, and wash treatment matter more than hype captions.",
    content:
      "Premium hoodies begin with fabric selection, but finish quality defines the product. Double-needle stitching at stress points, pre-shrunk cotton blends, and consistent panel cutting all impact comfort and shape retention. Great basics are engineered, not improvised.",
  },
  {
    id: 6,
    title: "Care Guide: Keep Your Graphic Tees Fresh For 50+ Wears",
    category: "Care",
    author: "Daniel Reed",
    date: "Mar 13, 2026",
    image: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=1200&q=80",
    excerpt:
      "Simple wash and dry rules that protect print quality and prevent color fade.",
    content:
      "Wash graphic tees inside out using cold water and mild detergent. Avoid high-heat drying because it cracks prints and shrinks necklines. Air-dry on flat surfaces when possible, then fold instead of hanging to keep shoulder seams from stretching.",
  },
  {
    id: 7,
    title: "How Fashion Creators Build Viral Outfit Reels",
    category: "Content",
    author: "Olivia White",
    date: "Mar 10, 2026",
    image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80",
    excerpt:
      "A repeatable format for transitions, hooks, and music timing that boosts saves.",
    content:
      "Start with a strong first frame showing the final fit, then rewind to the base layer for the transition story. Keep cuts tight, use beat-synced swaps, and add on-screen text for item names. The easier the look is to recreate, the higher the share rate.",
  },
  {
    id: 8,
    title: "Sneaker Rotation 101: Daily, Clean, And Statement Pairs",
    category: "Footwear",
    author: "Noah Kim",
    date: "Mar 7, 2026",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80",
    excerpt:
      "A 3-pair strategy that covers errands, campus, and night events without overbuying.",
    content:
      "Use one neutral everyday sneaker for utility, one easy-clean pair for heavy use, and one statement pair for standout looks. Rotate between pairs to extend outsole life and maintain shape. Consistent cleaning routines keep white midsoles from yellowing.",
  },
  {
    id: 9,
    title: "Pop-Up Shop Checklist For First-Time Brand Owners",
    category: "Retail",
    author: "Priya Shah",
    date: "Mar 2, 2026",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80",
    excerpt:
      "The essentials for venue flow, inventory rails, and checkout speed on launch day.",
    content:
      "Design your pop-up path so visitors move from hero pieces to accessories naturally. Keep size runs visible and train staff on fast fit advice. A compact checkout station with clear pricing signage can dramatically reduce drop-day bounce.",
  },
];

const FALLBACK_DROPS = [
  {
    id: 1,
    name: "Chrome Pulse Hoodie",
    category: "Outerwear",
    price: 89,
    status: "Live",
    colorway: "Obsidian / Ice",
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=1200&q=80",
    tagline: "Heavyweight hoodie with reflective print for late-night city fits.",
  },
  {
    id: 2,
    name: "Static Drift Cargo",
    category: "Bottoms",
    price: 74,
    status: "Low Stock",
    colorway: "Sandstorm",
    image: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=1200&q=80",
    tagline: "Relaxed cargos with utility pockets and clean taper.",
  },
  {
    id: 3,
    name: "No Signal Tee",
    category: "Tops",
    price: 39,
    status: "Live",
    colorway: "Cloud White",
    image: "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=1200&q=80",
    tagline: "Oversized everyday tee with soft combed cotton finish.",
  },
  {
    id: 4,
    name: "Neon Loop Varsity",
    category: "Outerwear",
    price: 129,
    status: "Coming Soon",
    colorway: "Ink / Neon Lime",
    image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=80",
    tagline: "Statement varsity for spotlight drops and creator collabs.",
  },
];

function getFallbackRecommendations(activeBlogs, desiredLimit = 3) {
  const items = Array.isArray(activeBlogs) ? activeBlogs : [];
  if (!items.length) {
    return [];
  }

  const seed = items[0];
  return items
    .filter((entry) => entry.id !== seed.id)
    .slice(0, desiredLimit);
}

function LoginGate({
  authMode,
  setAuthMode,
  selectedRole,
  setSelectedRole,
  onSignup,
  onLogin,
  loginError,
  loginBusy,
  embedded = false,
  onClose,
}) {
  const [signupForm, setSignupForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });
  const [formError, setFormError] = useState("");

  function updateSignupField(field, value) {
    setSignupForm((prev) => ({ ...prev, [field]: value }));
    setFormError("");
  }

  function updateLoginField(field, value) {
    setLoginForm((prev) => ({ ...prev, [field]: value }));
    setFormError("");
  }

  function handleSignupSubmit(event) {
    event.preventDefault();

    if (
      !signupForm.name.trim() ||
      !signupForm.email.trim() ||
      !signupForm.password ||
      !signupForm.confirmPassword
    ) {
      setFormError("Please fill all signup fields.");
      return;
    }

    if (signupForm.password !== signupForm.confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    if (signupForm.password.length < 6) {
      setFormError("Password must be at least 6 characters long.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupForm.email.trim())) {
      setFormError("Please enter a valid email address.");
      return;
    }

    setFormError("");
    onSignup({
      name: signupForm.name.trim(),
      email: signupForm.email.trim(),
      password: signupForm.password,
      role: selectedRole,
    });
  }

  function handleLoginSubmit(event) {
    event.preventDefault();

    if (!loginForm.email.trim() || !loginForm.password) {
      setFormError("Please enter email and password.");
      return;
    }

    setFormError("");
    onLogin({
      email: loginForm.email.trim(),
      password: loginForm.password,
    });
  }

  const authCard = (
    <section className={`auth-card ${embedded ? "auth-card-inline" : ""}`}>
      {embedded ? (
        <div className="auth-inline-header">
          <p className="auth-kicker">Corbin &amp; Hudson Street Lab</p>
          <button type="button" className="auth-close" onClick={onClose} aria-label="Close auth panel">
            x
          </button>
        </div>
      ) : (
        <p className="auth-kicker">Corbin &amp; Hudson Street Lab</p>
      )}
        <h1>{authMode === "signup" ? "Create your account" : "Sign in to your account"}</h1>
        <p className="auth-note">
          {authMode === "signup"
            ? "Create an account first. You must be authenticated before you can use the blog page."
            : "Sign in with your existing account to access the blog page."}
        </p>

        <div className="role-picker">
          <button
            type="button"
            className={`role-chip ${authMode === "signup" ? "active" : ""}`}
            onClick={() => setAuthMode("signup")}
          >
            Sign Up
          </button>
          <button
            type="button"
            className={`role-chip ${authMode === "login" ? "active" : ""}`}
            onClick={() => setAuthMode("login")}
          >
            Sign In
          </button>
        </div>

        {authMode === "signup" ? (
          <form className="client-id-form" onSubmit={handleSignupSubmit}>
            <label htmlFor="signup-name">Full Name</label>
            <input
              id="signup-name"
              type="text"
              placeholder="Your full name"
              required
              value={signupForm.name}
              onChange={(event) => updateSignupField("name", event.target.value)}
            />
            <label htmlFor="signup-email">Email</label>
            <input
              id="signup-email"
              type="email"
              placeholder="you@example.com"
              required
              value={signupForm.email}
              onChange={(event) => updateSignupField("email", event.target.value)}
            />
            <label htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              type="password"
              placeholder="At least 6 characters"
              minLength={6}
              required
              value={signupForm.password}
              onChange={(event) => updateSignupField("password", event.target.value)}
            />
            <label htmlFor="signup-confirm-password">Confirm Password</label>
            <input
              id="signup-confirm-password"
              type="password"
              placeholder="Re-enter password"
              minLength={6}
              required
              value={signupForm.confirmPassword}
              onChange={(event) => updateSignupField("confirmPassword", event.target.value)}
            />

            <div className="role-picker" role="radiogroup" aria-label="Account role">
              {["reader", "editor", "administrator"].map((role) => (
                <label key={role} className={`role-chip ${selectedRole === role ? "active" : ""}`}>
                  <input
                    type="radio"
                    name="role"
                    value={role}
                    checked={selectedRole === role}
                    onChange={(event) => setSelectedRole(event.target.value)}
                  />
                  <span>{role.charAt(0).toUpperCase() + role.slice(1)}</span>
                </label>
              ))}
            </div>

            {formError ? <p className="auth-error">{formError}</p> : null}

            <div className="client-id-actions">
              <button type="submit" disabled={loginBusy}>
                {loginBusy ? "Creating account..." : "Create Account"}
              </button>
            </div>
            <p className="auth-switch-text">
              Already have an account?{" "}
              <button type="button" className="auth-switch-btn" onClick={() => setAuthMode("login")}>
                Sign In
              </button>
            </p>
          </form>
        ) : (
          <form className="client-id-form" onSubmit={handleLoginSubmit}>
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              placeholder="you@example.com"
              required
              value={loginForm.email}
              onChange={(event) => updateLoginField("email", event.target.value)}
            />
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              placeholder="Your password"
              required
              value={loginForm.password}
              onChange={(event) => updateLoginField("password", event.target.value)}
            />
            {formError ? <p className="auth-error">{formError}</p> : null}
            <div className="client-id-actions">
              <button type="submit" disabled={loginBusy}>
                {loginBusy ? "Signing in..." : "Sign In"}
              </button>
            </div>
            <p className="auth-switch-text">
              New here?{" "}
              <button type="button" className="auth-switch-btn" onClick={() => setAuthMode("signup")}>
                Create Account
              </button>
            </p>
          </form>
        )}

        {loginError ? <p className="auth-error">{loginError}</p> : null}
    </section>
  );

  if (embedded) {
    return authCard;
  }

  return <main className="auth-shell">{authCard}</main>;
}

function AppShell({
  apiBaseUrl,
  token,
  user,
  onLogout,
  authMode,
  setAuthMode,
  selectedRole,
  setSelectedRole,
  onSignup,
  onLogin,
  loginError,
  loginBusy,
  authChecking,
}) {
  const [blogs, setBlogs] = useState([]);
  const [drops, setDrops] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [topActionNote, setTopActionNote] = useState("");
  const [route, setRoute] = useState(() => parseRouteFromHash(window.location.hash));
  const [pageData, setPageData] = useState(null);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiDraftHints, setAiDraftHints] = useState([]);
  const [aiPrompt, setAiPrompt] = useState({
    topic: "",
    tone: "practical",
    audience: "new creators",
  });
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [aiSummaryByBlogId, setAiSummaryByBlogId] = useState({});
  const [aiSummaryLoadingId, setAiSummaryLoadingId] = useState(null);
  const [deleteBusyId, setDeleteBusyId] = useState(null);
  const [selectedStory, setSelectedStory] = useState(null);
  const [createForm, setCreateForm] = useState({
    title: "",
    category: "",
    image: "",
    excerpt: "",
    content: "",
  });

  useEffect(() => {
    async function loadBlogs() {
      try {
        const response = await fetch(`${apiBaseUrl}/blogs`);
        if (!response.ok) {
          throw new Error(`Failed with status ${response.status}`);
        }

        const payload = await response.json();
        const items = Array.isArray(payload.items) ? payload.items : [];
        setBlogs(items);
      } catch (error) {
        setBlogs(FALLBACK_BLOGS);
      }
    }

    loadBlogs();
  }, [apiBaseUrl]);

  useEffect(() => {
    async function loadDrops() {
      try {
        const response = await fetch(`${apiBaseUrl}/drops?limit=4`);
        if (!response.ok) {
          throw new Error(`Failed with status ${response.status}`);
        }

        const payload = await response.json();
        const items = Array.isArray(payload.items) ? payload.items : [];
        setDrops(items);
      } catch (error) {
        setDrops(FALLBACK_DROPS);
      }
    }

    loadDrops();
  }, [apiBaseUrl]);

  useEffect(() => {
    if (!user) {
      setShowCreateModal(false);
    }
  }, [user]);

  useEffect(() => {
    function syncRouteFromHash() {
      setRoute(parseRouteFromHash(window.location.hash));
    }

    window.addEventListener("hashchange", syncRouteFromHash);
    return () => {
      window.removeEventListener("hashchange", syncRouteFromHash);
    };
  }, []);

  useEffect(() => {
    if (route.view !== "page" || !route.slug) {
      setPageData(null);
      setIsPageLoading(false);
      return;
    }

    const fallback = FALLBACK_PAGES[route.slug] || null;
    setPageData(fallback);
    setIsPageLoading(true);

    async function loadPageData() {
      try {
        const response = await fetch(`${apiBaseUrl}/pages/${route.slug}`);
        if (!response.ok) {
          throw new Error(`Failed with status ${response.status}`);
        }

        const payload = await response.json();
        setPageData(payload);
      } catch (error) {
        setPageData(fallback);
      } finally {
        setIsPageLoading(false);
      }
    }

    loadPageData();
  }, [apiBaseUrl, route]);

  useEffect(() => {
    if (route.view === "login" && user) {
      window.location.hash = "#/";
    }
  }, [route.view, user]);

  const activeBlogs = blogs.length ? blogs : FALLBACK_BLOGS;
  const activeDrops = drops.length ? drops : FALLBACK_DROPS;
  const canCreateBlogs = user?.role === "editor" || user?.role === "administrator";
  const isAdministrator = user?.role === "administrator";

  useEffect(() => {
    if (!activeBlogs.length) {
      setAiRecommendations([]);
      return;
    }

    async function loadRecommendations() {
      const seedId = activeBlogs[0]?.id;
      if (!seedId) {
        setAiRecommendations(getFallbackRecommendations(activeBlogs, 3));
        return;
      }

      try {
        const response = await fetch(`${apiBaseUrl}/ai/recommendations?seedId=${seedId}&limit=3`);
        if (!response.ok) {
          throw new Error(`Failed with status ${response.status}`);
        }

        const payload = await response.json();
        const items = Array.isArray(payload.items) ? payload.items : [];
        if (!items.length) {
          setAiRecommendations(getFallbackRecommendations(activeBlogs, 3));
          return;
        }

        setAiRecommendations(items);
      } catch (error) {
        setAiRecommendations(getFallbackRecommendations(activeBlogs, 3));
      }
    }

    loadRecommendations();
  }, [activeBlogs, apiBaseUrl]);

  const featureSections = useMemo(() => {
    return [
      {
        title: "Build Signature Fits",
        description:
          "Create statement looks with layered basics, clean silhouettes, and bold finishing pieces.",
        image: activeBlogs[1]?.image || FALLBACK_BLOGS[1].image,
      },
      {
        title: "Launch Sharp Drop Pages",
        description:
          "Turn each collection into a focused launch story with product highlights and styling notes.",
        image: activeBlogs[4]?.image || FALLBACK_BLOGS[4].image,
      },
      {
        title: "Convert Vibe Into Revenue",
        description:
          "Use hype windows, fit breakdowns, and creator showcases to move from views to checkouts.",
        image: activeBlogs[6]?.image || FALLBACK_BLOGS[6].image,
      },
      {
        title: "Track What Actually Sells",
        description:
          "Read engagement signals and product clicks so your next drop is guided by real demand.",
        image: activeBlogs[8]?.image || FALLBACK_BLOGS[8].image,
      },
      {
        title: "Archive Your Brand DNA",
        description:
          "Keep every drop story, visual campaign, and lookbook in one discoverable timeline.",
        image: activeBlogs[0]?.image || FALLBACK_BLOGS[0].image,
      },
    ];
  }, [activeBlogs]);

  const storyHighlights = useMemo(() => activeBlogs.slice(0, 3), [activeBlogs]);

  const communityStats = [
    { label: "Style Creators", value: "28k+" },
    { label: "Fits Shared", value: "410k+" },
    { label: "Monthly Viewers", value: "5.7M" },
  ];

  const communityBenefits = [
    "Weekly look critiques with feedback from stylists and creators.",
    "Friday creator spotlights that feature breakout streetwear voices.",
    "A private crew space for collabs, pop-up events, and growth tactics.",
  ];

  const helpLinks = INFO_LINKS.filter((item) =>
    ["help-center", "publishing-guide", "video-tutorials"].includes(item.slug)
  );
  const legalLinks = INFO_LINKS.filter((item) =>
    ["terms-of-service", "privacy", "content-policy"].includes(item.slug)
  );

  const showLoginPage = route.view === "login";
  const showInfoPage = route.view === "page";
  const showAdminPage = route.view === "admin";

  function handleTopLoginClick() {
    if (user) {
      setTopActionNote("You are already logged in.");
      return;
    }

    setAuthMode("login");
    setTopActionNote("");
    window.location.hash = "#/login";
  }

  function handleTopCreateBlogClick() {
    if (!user) {
      setAuthMode("signup");
      setTopActionNote("Create an account or log in first to publish a blog.");
      window.location.hash = "#/login";
      return;
    }

    if (!canCreateBlogs) {
      setTopActionNote("Your role cannot create blogs. Use an editor or administrator account.");
      return;
    }

    setTopActionNote("");
    setShowCreateModal(true);
  }

  async function handleCreateBlog(event) {
    event.preventDefault();
    setCreateError("");

    const payload = {
      title: createForm.title.trim(),
      category: createForm.category.trim(),
      image: createForm.image.trim(),
      excerpt: createForm.excerpt.trim(),
      content: createForm.content.trim(),
    };

    if (!payload.title || !payload.category || !payload.image || !payload.excerpt || !payload.content) {
      setCreateError("Please complete all blog fields.");
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch(`${apiBaseUrl}/blogs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload.error || "Failed to publish blog");
      }

      const created = await response.json();
      setBlogs((prev) => [created, ...prev]);
      setCreateForm({
        title: "",
        category: "",
        image: "",
        excerpt: "",
        content: "",
      });
      setShowCreateModal(false);
    } catch (error) {
      setCreateError(error.message || "Failed to publish blog");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleGenerateDraftWithAI() {
    if (!aiPrompt.topic.trim()) {
      setAiError("Add a topic first so AI can draft the blog.");
      return;
    }

    setAiBusy(true);
    setAiError("");
    setAiDraftHints([]);

    try {
      const response = await fetch(`${apiBaseUrl}/ai/generate-draft`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(aiPrompt),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Unable to generate draft");
      }

      const draft = payload.draft || {};
      setCreateForm((prev) => ({
        ...prev,
        title: draft.title || prev.title,
        category: draft.category || prev.category,
        image: draft.image || prev.image,
        excerpt: draft.excerpt || prev.excerpt,
        content: draft.content || prev.content,
      }));
      setAiDraftHints(Array.isArray(draft.keywords) ? draft.keywords : []);
    } catch (error) {
      setAiError(error.message || "Unable to generate draft");
    } finally {
      setAiBusy(false);
    }
  }

  async function handleCreateStorySummary(story) {
    if (!story?.id || !story?.content) {
      return;
    }

    if (aiSummaryByBlogId[story.id]) {
      setAiSummaryByBlogId((prev) => {
        const next = { ...prev };
        delete next[story.id];
        return next;
      });
      return;
    }

    setAiSummaryLoadingId(story.id);

    try {
      const response = await fetch(`${apiBaseUrl}/ai/summarize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: story.content }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Failed to summarize story");
      }

      setAiSummaryByBlogId((prev) => ({
        ...prev,
        [story.id]: {
          summary: payload.summary || "",
          bulletPoints: Array.isArray(payload.bulletPoints) ? payload.bulletPoints : [],
          keywords: Array.isArray(payload.keywords) ? payload.keywords : [],
          readingTimeMinutes: payload.readingTimeMinutes || 1,
        },
      }));
    } catch (error) {
      setTopActionNote(error.message || "Failed to summarize story");
    } finally {
      setAiSummaryLoadingId(null);
    }
  }

  async function handleDeleteBlog(story) {
    if (!story?.id || !isAdministrator) {
      return;
    }

    const confirmed = window.confirm(`Delete \"${story.title}\"? This action cannot be undone.`);
    if (!confirmed) {
      return;
    }

    setDeleteBusyId(story.id);
    setTopActionNote("");

    try {
      const response = await fetch(`${apiBaseUrl}/blogs/${story.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to delete blog");
      }

      setBlogs((prev) => prev.filter((entry) => entry.id !== story.id));
      setAiSummaryByBlogId((prev) => {
        const next = { ...prev };
        delete next[story.id];
        return next;
      });
      setTopActionNote("Blog deleted successfully.");
    } catch (error) {
      setTopActionNote(error.message || "Failed to delete blog");
    } finally {
      setDeleteBusyId(null);
    }
  }

  function handleViewStory(story) {
    if (!story) {
      return;
    }

    setSelectedStory(story);
  }

  if (showLoginPage) {
    return (
      <main className="page-wrap auth-page-wrap">
        <header className="topbar auth-topbar">
          <a href="#/" className="brand brand-link" aria-label="Corbin and Hudson home">
            <span className="brand-monogram">C&amp;H</span>
            <span className="brand-text-group">
              <span className="brand-name">Corbin &amp; Hudson</span>
              <span className="brand-tag">Street Lab</span>
            </span>
          </a>
          <a href="#/" className="auth-back-link">
            Back to Blog
          </a>
        </header>
        <section className="auth-shell-page">
          <LoginGate
            authMode={authMode}
            setAuthMode={setAuthMode}
            selectedRole={selectedRole}
            setSelectedRole={setSelectedRole}
            onSignup={onSignup}
            onLogin={onLogin}
            loginError={loginError}
            loginBusy={loginBusy}
            embedded={true}
            onClose={() => {
              window.location.hash = "#/";
            }}
          />
        </section>
      </main>
    );
  }

  return (
    <main className="page-wrap">
      <header className="topbar">
        <a href="#/" className="brand brand-link" aria-label="Corbin and Hudson home">
          <span className="brand-monogram">C&amp;H</span>
          <span className="brand-text-group">
            <span className="brand-name">Corbin &amp; Hudson</span>
              <span className="brand-tag">Street Lab</span>
          </span>
        </a>
        <nav className="top-links" aria-label="Primary">
          <a href="#features">Features</a>
          <a href="#drops">Drops</a>
          <a href="#stories">Journal</a>
          <a href="#community">Crew</a>
          {isAdministrator ? <a href="#/admin" className="admin-link">Admin Studio</a> : null}
        </nav>
        <div className="top-auth-controls">
          <button type="button" className="auth-top-btn" onClick={handleTopLoginClick}>
            Log In
          </button>
          <button type="button" className="auth-top-btn soft" onClick={handleTopCreateBlogClick}>
            Create A Blog
          </button>
        </div>
        {user && (<div className="user-pill">
          {user?.picture ? <img src={user.picture} alt={user.name} className="user-avatar" /> : null}
          <div>
            <p className="user-name">{user?.name || user?.email}</p>
            <p className="user-role">{user?.role}</p>
          </div>
          <button type="button" className="logout-btn" onClick={onLogout}>
            Logout
          </button>
        </div>)}
      </header>

      {topActionNote ? <p className="top-action-note">{topActionNote}</p> : null}

      {showCreateModal && canCreateBlogs ? (
        <div className="create-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <section className="create-modal" onClick={(event) => event.stopPropagation()}>
            <div className="create-modal-header">
              <div>
                <h3>Create Blog</h3>
                <p>Signed in as {user.role}. Publish directly to your style journal feed.</p>
              </div>
              <button
                type="button"
                className="auth-close"
                aria-label="Close create blog panel"
                onClick={() => setShowCreateModal(false)}
              >
                x
              </button>
            </div>
            <form className="blog-form" onSubmit={handleCreateBlog}>
              <div className="ai-helper-panel">
                <div className="ai-helper-head">
                  <div>
                    <p className="ai-helper-kicker">AI Studio</p>
                    <h4>Draft Assistant</h4>
                  </div>
                  <span className="ai-helper-chip">Creative Mode</span>
                </div>
                <p>Describe your idea and let AI prepare a polished first draft with title, category, excerpt, content, and cover image.</p>
                <label htmlFor="ai-topic" className="field-label">Topic</label>
                <input
                  id="ai-topic"
                  type="text"
                  placeholder="For example: email marketing for indie makers"
                  value={aiPrompt.topic}
                  onChange={(event) =>
                    setAiPrompt((prev) => ({ ...prev, topic: event.target.value }))
                  }
                />
                <div className="ai-helper-grid">
                  <div>
                    <label htmlFor="ai-tone" className="field-label">Tone</label>
                    <select
                      id="ai-tone"
                      value={aiPrompt.tone}
                      onChange={(event) =>
                        setAiPrompt((prev) => ({ ...prev, tone: event.target.value }))
                      }
                    >
                      <option value="practical">Practical</option>
                      <option value="clear">Clear</option>
                      <option value="friendly">Friendly</option>
                      <option value="bold">Bold</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="ai-audience" className="field-label">Audience</label>
                    <input
                      id="ai-audience"
                      type="text"
                      placeholder="Audience"
                      value={aiPrompt.audience}
                      onChange={(event) =>
                        setAiPrompt((prev) => ({ ...prev, audience: event.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="ai-helper-actions">
                  <button type="button" className="ai-generate-btn" onClick={handleGenerateDraftWithAI} disabled={aiBusy}>
                    {aiBusy ? "Generating draft..." : "Generate With AI"}
                  </button>
                  <p className="ai-helper-tip">Tip: use a specific topic to get sharper output.</p>
                </div>
                {aiDraftHints.length ? (
                  <p className="ai-hints">Suggested keywords: {aiDraftHints.join(", ")}</p>
                ) : null}
                {aiError ? <p className="auth-error">{aiError}</p> : null}
              </div>

              <section className="editor-panel">
                <div className="editor-panel-head">
                  <h4>Story Editor</h4>
                  <span>Refine before publishing</span>
                </div>

                <div className="editor-grid">
                  <label className="editor-field">
                    <span className="field-label">Blog Title</span>
                    <input
                      type="text"
                      placeholder="Blog title"
                      value={createForm.title}
                      onChange={(event) =>
                        setCreateForm((prev) => ({ ...prev, title: event.target.value }))
                      }
                    />
                  </label>

                  <label className="editor-field">
                    <span className="field-label">Category</span>
                    <input
                      type="text"
                      placeholder="Category"
                      value={createForm.category}
                      onChange={(event) =>
                        setCreateForm((prev) => ({ ...prev, category: event.target.value }))
                      }
                    />
                  </label>

                  <label className="editor-field full-span">
                    <span className="field-label">Cover Image URL</span>
                    <input
                      type="url"
                      placeholder="Cover image URL"
                      value={createForm.image}
                      onChange={(event) =>
                        setCreateForm((prev) => ({ ...prev, image: event.target.value }))
                      }
                    />
                  </label>

                  {createForm.image ? (
                    <div className="image-preview full-span">
                      <p className="image-preview-label">Cover Preview</p>
                      <img src={createForm.image} alt="Cover preview" />
                    </div>
                  ) : null}

                  <label className="editor-field full-span">
                    <span className="field-label">Excerpt</span>
                    <textarea
                      placeholder="Short excerpt"
                      rows="3"
                      value={createForm.excerpt}
                      onChange={(event) =>
                        setCreateForm((prev) => ({ ...prev, excerpt: event.target.value }))
                      }
                    />
                  </label>

                  <label className="editor-field full-span">
                    <span className="field-label">Full Content</span>
                    <textarea
                      placeholder="Full content"
                      rows="7"
                      value={createForm.content}
                      onChange={(event) =>
                        setCreateForm((prev) => ({ ...prev, content: event.target.value }))
                      }
                    />
                  </label>
                </div>
              </section>

              {createError ? <p className="auth-error">{createError}</p> : null}
              <div className="blog-form-actions">
                <button type="submit" disabled={isCreating}>
                  {isCreating ? "Publishing..." : "Publish Blog"}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {selectedStory ? (
        <div className="view-modal-overlay" onClick={() => setSelectedStory(null)}>
          <section className="view-modal" onClick={(event) => event.stopPropagation()}>
            <div className="view-modal-header">
              <div>
                <p className="view-modal-kicker">Story Viewer</p>
                <h3>{selectedStory.title}</h3>
                <p className="view-modal-meta">{selectedStory.category} · {selectedStory.author} · {selectedStory.date}</p>
              </div>
              <button
                type="button"
                className="auth-close"
                aria-label="Close story viewer"
                onClick={() => setSelectedStory(null)}
              >
                x
              </button>
            </div>
            <img src={selectedStory.image} alt={selectedStory.title} className="view-modal-image" />
            <p className="view-modal-excerpt">{selectedStory.excerpt}</p>
            <p className="view-modal-content">{selectedStory.content}</p>
          </section>
        </div>
      ) : null}

      {showAdminPage ? (
        <section className="admin-page" id="admin-studio">
          <div className="admin-page-head">
            <div>
              <p className="admin-kicker">Administrator Control Center</p>
              <h1>Blog Operations Studio</h1>
              <p className="admin-summary">
                Monitor style posts, preview quickly, and remove any journal entry from one workspace.
              </p>
            </div>
            <a href="#/" className="back-link">&larr; Back to Home</a>
          </div>

          {isAdministrator ? (
            <>
              <div className="admin-stats-grid">
                <article className="admin-stat-card">
                  <p className="admin-stat-value">{activeBlogs.length}</p>
                  <p className="admin-stat-label">Total Blogs</p>
                </article>
                <article className="admin-stat-card">
                  <p className="admin-stat-value">{new Set(activeBlogs.map((blog) => blog.author)).size}</p>
                  <p className="admin-stat-label">Active Authors</p>
                </article>
                <article className="admin-stat-card">
                  <p className="admin-stat-value">{new Set(activeBlogs.map((blog) => blog.category)).size}</p>
                  <p className="admin-stat-label">Categories</p>
                </article>
              </div>

              <div className="admin-blog-grid">
                {activeBlogs.map((story) => (
                  <article className="admin-blog-card" key={`admin-${story.id}`}>
                    <img src={story.image} alt={story.title} className="admin-blog-image" />
                    <div className="admin-blog-body">
                      <p className="story-meta">{story.category} · {story.date}</p>
                      <h3>{story.title}</h3>
                      <p>{story.excerpt}</p>
                      <div className="admin-blog-actions">
                        <button
                          type="button"
                          className="story-view-btn"
                          onClick={() => handleViewStory(story)}
                        >
                          View Story
                        </button>
                        <button
                          type="button"
                          className="story-delete-btn"
                          onClick={() => handleDeleteBlog(story)}
                          disabled={deleteBusyId === story.id}
                        >
                          {deleteBusyId === story.id ? "Removing..." : "Remove Blog"}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <div className="admin-locked-card">
              <h3>Administrator access required</h3>
              <p>
                This page is restricted. Sign in with an administrator account to manage and remove blogs.
              </p>
            </div>
          )}
        </section>
      ) : showInfoPage ? (
        <section className="info-page" id="community">
          <a href="#/" className="back-link">&larr; Back to Home</a>
          {isPageLoading && <p className="info-meta">Loading page content...</p>}
          {pageData ? (
            <>
              <h1>{pageData.title}</h1>
              <p className="info-summary">{pageData.summary}</p>
              <div className="info-grid">
                {(pageData.sections || []).map((section) => (
                  <article key={section.heading} className="info-card">
                    <h3>{section.heading}</h3>
                    <p>{section.body}</p>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <>
              <h1>Page Not Found</h1>
              <p className="info-summary">
                The requested page does not exist. Please choose another item from the footer.
              </p>
            </>
          )}
        </section>
      ) : (
        <>
          <section id="features" className="feature-stack">
            {featureSections.map((section, index) => (
              <article
                key={section.title}
                className={`feature-row ${index % 2 ? "reverse" : ""}`}
              >
                <div className="feature-copy">
                  <h2>{section.title}</h2>
                  <p>{section.description}</p>
                </div>
                <img src={section.image} alt={section.title} className="feature-image" />
              </article>
            ))}
          </section>

          <section className="drops-section" id="drops">
            <div className="section-head">
              <h3>Latest Drops</h3>
              <p>Fresh pieces from the current lineup. Built for daily wear, shot for social.</p>
            </div>
            <div className="drops-grid">
              {activeDrops.map((drop) => (
                <article className="drop-card" key={`drop-${drop.id}`}>
                  <img src={drop.image} alt={drop.name} className="drop-image" />
                  <div className="drop-body">
                    <p className="drop-topline">
                      <span>{drop.category}</span>
                      <span>{drop.status}</span>
                    </p>
                    <h4>{drop.name}</h4>
                    <p>{drop.tagline}</p>
                    <p className="drop-meta">{drop.colorway} · ${drop.price}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="long-section">
            <h3>Join creators building style culture with Corbin &amp; Hudson</h3>
            <p>
              Whether you run a clothing label or share daily outfit content, this platform gives you a
              fast content workflow with launch-ready storytelling from your first post.
            </p>
          </section>

          <section className="stories-section" id="stories">
            <div className="section-head">
              <h3>Stories</h3>
              <p>Popular reads from creators shaping fashion conversations this month.</p>
            </div>
            <div className="stories-grid">
              {storyHighlights.map((story) => (
                <article className="story-card" key={story.id}>
                  <img src={story.image} alt={story.title} className="story-image" />
                  <div className="story-body">
                    <p className="story-meta">{story.category} · {story.date}</p>
                    <h4>{story.title}</h4>
                    <p>{story.excerpt}</p>
                    <div className="story-card-actions">
                      <button
                        type="button"
                        className="story-view-btn"
                        onClick={() => handleViewStory(story)}
                      >
                        View Story
                      </button>
                      <button
                        type="button"
                        className="story-ai-btn"
                        onClick={() => handleCreateStorySummary(story)}
                        disabled={aiSummaryLoadingId === story.id}
                      >
                        {aiSummaryLoadingId === story.id
                          ? "Summarizing..."
                          : aiSummaryByBlogId[story.id]
                          ? "Hide AI Summary"
                          : "AI Summary"}
                      </button>
                      {isAdministrator ? (
                        <button
                          type="button"
                          className="story-delete-btn"
                          onClick={() => handleDeleteBlog(story)}
                          disabled={deleteBusyId === story.id}
                        >
                          {deleteBusyId === story.id ? "Deleting..." : "Delete"}
                        </button>
                      ) : null}
                    </div>
                    {aiSummaryByBlogId[story.id] ? (
                      <div className="story-ai-summary">
                        <p>{aiSummaryByBlogId[story.id].summary}</p>
                        <p className="story-ai-meta">
                          {aiSummaryByBlogId[story.id].readingTimeMinutes} min read · {aiSummaryByBlogId[story.id].keywords.join(", ")}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="stories-section" id="ai-picks">
            <div className="section-head">
              <h3>AI Picks For You</h3>
              <p>Recommended reads based on your current style interests.</p>
            </div>
            <div className="stories-grid">
              {aiRecommendations.map((story) => (
                <article className="story-card" key={`ai-${story.id}`}>
                  <img src={story.image} alt={story.title} className="story-image" />
                  <div className="story-body">
                    <p className="story-meta">{story.category} · {story.date}</p>
                    <h4>{story.title}</h4>
                    <p>{story.excerpt}</p>
                    <div className="story-card-actions">
                      <button
                        type="button"
                        className="story-view-btn"
                        onClick={() => handleViewStory(story)}
                      >
                        View Story
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="community-section" id="community">
            <div className="section-head">
              <h3>Community</h3>
              <p>Build your audience with a crew that helps creators ship consistently.</p>
            </div>
            <div className="community-layout">
              <div className="community-stats">
                {communityStats.map((item) => (
                  <article key={item.label} className="stat-pill">
                    <p className="stat-value">{item.value}</p>
                    <p className="stat-label">{item.label}</p>
                  </article>
                ))}
              </div>
              <div className="community-points">
                <h4>Why creators stay here</h4>
                <ul>
                  {communityBenefits.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </>
      )}

      <footer className="site-footer">
        <div className="footer-brand-wrap">
          <div className="footer-brand-mark">C&amp;H</div>
          <div>
            <div className="footer-brand">Corbin &amp; Hudson</div>
            <p className="footer-tag">A Gen-Z style journal for creators and clothing brands.</p>
          </div>
        </div>
        <div className="footer-columns">
          <div>
            <h4>Help</h4>
            {helpLinks.map((item) => (
              <a key={item.slug} href={`#/page/${item.slug}`}>
                {item.label}
              </a>
            ))}
          </div>
          <div>
            <h4>Legal</h4>
            {legalLinks.map((item) => (
              <a key={item.slug} href={`#/page/${item.slug}`}>
                {item.label}
              </a>
            ))}
          </div>
        </div>
        <div className="footer-social">
          <h4>Connect</h4>
          <div className="social-links">
            <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer">
              Instagram
            </a>
            <a href="https://corbinhudson.com" target="_blank" rel="noopener noreferrer">
              Official Site
            </a>
            <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer">
              LinkedIn
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}

function App() {
  const apiBaseUrl = resolveApiBaseUrl();
  const [token, setToken] = useState(() => localStorage.getItem("blogAuthToken") || "");
  const [user, setUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState("editor");
  const [authMode, setAuthMode] = useState("login");
  const [authChecking, setAuthChecking] = useState(Boolean(token));
  const [loginError, setLoginError] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);

  useEffect(() => {
    if (!token || user) {
      setAuthChecking(false);
      return;
    }

    let cancelled = false;

    async function restoreSession() {
      try {
        const response = await fetch(`${apiBaseUrl}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Session expired");
        }

        const payload = await response.json();
        if (!cancelled) {
          setUser(payload.user || null);
          setLoginError("");
        }
      } catch (error) {
        if (!cancelled) {
          localStorage.removeItem("blogAuthToken");
          setToken("");
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setAuthChecking(false);
        }
      }
    }

    setAuthChecking(true);
    restoreSession();

    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl, token]);

  const handleAuthRequest = React.useCallback(
    async (endpoint, requestPayload) => {
      setLoginBusy(true);
      setLoginError("");
      try {
        const response = await fetch(`${apiBaseUrl}${endpoint}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestPayload),
        });

        const responseData = await response.json();

        if (!response.ok) {
          throw new Error(responseData.error || "Authentication failed");
        }

        if (!responseData.token || !responseData.user || !responseData.user.role) {
          throw new Error("Invalid authentication response from server");
        }

        localStorage.setItem("blogAuthToken", responseData.token);
        setAuthChecking(false);
        setUser(responseData.user);
        setToken(responseData.token);
        window.location.hash = "#/";
      } catch (error) {
        if (error instanceof TypeError) {
          setLoginError(
            "Cannot reach auth server. Start backend on port 4000 or set window.BLOG_API_URL in frontend/index.html."
          );
        } else {
          setLoginError(error.message || "Authentication failed");
        }
      } finally {
        setLoginBusy(false);
      }
    },
    [apiBaseUrl]
  );

  const handleSignup = React.useCallback(
    (payload) => {
      handleAuthRequest("/auth/signup", payload);
    },
    [handleAuthRequest]
  );

  const handleLogin = React.useCallback(
    (payload) => {
      handleAuthRequest("/auth/login", payload);
    },
    [handleAuthRequest]
  );

  function handleLogout() {
    localStorage.removeItem("blogAuthToken");
    setToken("");
    setUser(null);
  }

  return (
    <AppShell
      apiBaseUrl={apiBaseUrl}
      token={token}
      user={user}
      onLogout={handleLogout}
      authMode={authMode}
      setAuthMode={setAuthMode}
      selectedRole={selectedRole}
      setSelectedRole={setSelectedRole}
      onSignup={handleSignup}
      onLogin={handleLogin}
      loginError={loginError}
      loginBusy={loginBusy}
      authChecking={authChecking}
    />
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
