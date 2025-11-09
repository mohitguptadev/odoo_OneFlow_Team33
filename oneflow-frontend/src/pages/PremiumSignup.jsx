import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  User, 
  CheckCircle, 
  XCircle,
  ArrowRight,
  ArrowLeft,
  DollarSign,
  Sparkles
} from "lucide-react";

const PremiumSignup = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "Team Member",
    hourly_rate: "",
    security_question: "",
    security_answer: ""
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const roles = [
    { id: "Admin", name: "Administrator", description: "Full system access" },
    { id: "Project Manager", name: "Project Manager", description: "Manage projects and teams" },
    { id: "Team Member", name: "Team Member", description: "Work on assigned tasks" },
    { id: "Sales/Finance", name: "Sales/Finance", description: "Handle financial operations" }
  ];

  const securityQuestions = [
    "What was the name of your first pet?",
    "What city were you born in?",
    "What was your mother's maiden name?",
    "What was the name of your elementary school?",
    "What is your favorite movie?"
  ];

  // Password strength calculator
  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: "", color: "" };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 2) return { strength, label: "Weak", color: "red" };
    if (strength <= 3) return { strength, label: "Medium", color: "yellow" };
    return { strength, label: "Strong", color: "green" };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  // Validation
  const validateStep = (stepNum) => {
    const newErrors = {};
    
    if (stepNum === 1) {
      if (!formData.full_name.trim()) newErrors.full_name = "Full name is required";
      if (!formData.email.trim()) {
        newErrors.email = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Invalid email format";
      }
      if (!formData.password) {
        newErrors.password = "Password is required";
      } else if (formData.password.length < 8) {
        newErrors.password = "Password must be at least 8 characters";
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
      if (!formData.security_question) {
        newErrors.security_question = "Security question is required";
      }
      if (!formData.security_answer.trim()) {
        newErrors.security_answer = "Security answer is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(1)) {
      setStep(1);
      return;
    }

    setLoading(true);
    setErrors({});

    const userData = {
      full_name: formData.full_name,
      email: formData.email,
      password: formData.password,
      role: formData.role,
      hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
      security_question: formData.security_question,
      security_answer: formData.security_answer
    };

    const result = await register(userData);

    if (result.success) {
      navigate("/dashboard");
    } else {
      setErrors({ submit: result.error });
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4 py-12 relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="w-full max-w-2xl relative z-10 animate-fade-in">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-4 shadow-lg transform hover:scale-110 transition-transform duration-300">
            <Sparkles className="text-white" size={32} />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            OneFlow
          </h1>
          <p className="text-gray-600 text-lg">
            Create your account to get started
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2].map((num) => (
              <React.Fragment key={num}>
                <div className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 ${
                      step > num
                        ? "bg-blue-600 text-white"
                        : step === num
                        ? "bg-gray-900 text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {step > num ? <CheckCircle size={20} /> : num}
                  </div>
                  {num < 2 && (
                    <div
                      className={`h-0.5 w-24 mx-2 transition-all duration-300 ${
                        step > num ? "bg-blue-600" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              </React.Fragment>
            ))}
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Step {step} of 2
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="glass-card bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 transition-all duration-300 hover:shadow-3xl">
          <form onSubmit={handleSubmit}>
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                    Personal Information
                  </h2>
                  <p className="text-sm text-gray-600">
                    Let's start with your basic details
                  </p>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => handleChange("full_name", e.target.value)}
                      placeholder="John Doe"
                      required
                      className={`w-full pl-10 pr-4 py-3.5 bg-gray-50/80 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 ${
                        errors.full_name
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-200 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-300"
                      } text-gray-900 placeholder-gray-400`}
                    />
                  </div>
                  {errors.full_name && (
                    <p className="text-red-500 text-sm mt-1">{errors.full_name}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      placeholder="you@example.com"
                      required
                      className={`w-full pl-10 pr-12 py-3.5 bg-gray-50/80 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 ${
                        errors.email
                          ? "border-red-500 focus:ring-red-500"
                          : formData.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
                          ? "border-green-500 focus:ring-green-500"
                          : "border-gray-200 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-300"
                      } text-gray-900 placeholder-gray-400`}
                    />
                    {formData.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) && (
                      <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500" size={20} />
                    )}
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleChange("password", e.target.value)}
                      placeholder="Create a strong password"
                      required
                      className={`w-full pl-10 pr-12 py-3.5 bg-gray-50/80 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 ${
                        errors.password
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-200 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-300"
                      } text-gray-900 placeholder-gray-400`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {/* Password Strength */}
                  {formData.password && (
                    <div className="mt-2">
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              passwordStrength.color === "red"
                                ? "bg-red-500"
                                : passwordStrength.color === "yellow"
                                ? "bg-yellow-500"
                                : "bg-green-500"
                            }`}
                            style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                          />
                        </div>
                        <span className={`text-xs font-medium ${
                          passwordStrength.color === "red"
                            ? "text-red-500"
                            : passwordStrength.color === "yellow"
                            ? "text-yellow-500"
                            : "text-green-500"
                        }`}>
                          {passwordStrength.label}
                        </span>
                      </div>
                    </div>
                  )}
                  {errors.password && (
                    <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => handleChange("confirmPassword", e.target.value)}
                      placeholder="Confirm your password"
                      required
                      className={`w-full pl-10 pr-12 py-3.5 bg-gray-50/80 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 ${
                        errors.confirmPassword
                          ? "border-red-500 focus:ring-red-500"
                          : formData.confirmPassword && formData.password === formData.confirmPassword
                          ? "border-green-500 focus:ring-green-500"
                          : "border-gray-200 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-300"
                      } text-gray-900 placeholder-gray-400`}
                    />
                    {formData.confirmPassword && formData.password === formData.confirmPassword && (
                      <CheckCircle className="absolute right-10 top-1/2 transform -translate-y-1/2 text-green-500" size={20} />
                    )}
                    {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                      <XCircle className="absolute right-10 top-1/2 transform -translate-y-1/2 text-red-500" size={20} />
                    )}
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
                  )}
                </div>

                {/* Security Question */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Security Question
                  </label>
                  <select
                    value={formData.security_question}
                    onChange={(e) => handleChange("security_question", e.target.value)}
                    required
                    className={`w-full px-4 py-3.5 bg-gray-50/80 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 ${
                      errors.security_question
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-200 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-300"
                    } text-gray-900`}
                  >
                    <option value="">Select a security question</option>
                    {securityQuestions.map((q, i) => (
                      <option key={i} value={q}>{q}</option>
                    ))}
                  </select>
                  {errors.security_question && (
                    <p className="text-red-500 text-sm mt-1">{errors.security_question}</p>
                  )}
                </div>

                {/* Security Answer */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Security Answer
                  </label>
                  <input
                    type="text"
                    value={formData.security_answer}
                    onChange={(e) => handleChange("security_answer", e.target.value)}
                    placeholder="Your answer"
                    required
                    className={`w-full px-4 py-3.5 bg-gray-50/80 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 ${
                      errors.security_answer
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-200 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-300"
                    } text-gray-900 placeholder-gray-400`}
                  />
                  {errors.security_answer && (
                    <p className="text-red-500 text-sm mt-1">{errors.security_answer}</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-offset-2 transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Continue</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            )}

            {/* Step 2: Role & Preferences */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                    Role & Preferences
                  </h2>
                  <p className="text-sm text-gray-600">
                    Select your role and set preferences
                  </p>
                </div>

                {/* Role Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Role
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {roles.map((role) => (
                      <div
                        key={role.id}
                        onClick={() => handleChange("role", role.id)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${
                          formData.role === role.id
                            ? "border-blue-600 bg-blue-50 shadow-md"
                            : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {role.name}
                            </h3>
                            <p className="text-xs text-gray-600 mt-1">
                              {role.description}
                            </p>
                          </div>
                          {formData.role === role.id && (
                            <CheckCircle className="text-gray-900" size={20} />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hourly Rate (Optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hourly Rate <span className="text-gray-500">(Optional)</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="number"
                      value={formData.hourly_rate}
                      onChange={(e) => handleChange("hourly_rate", e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="w-full pl-10 pr-4 py-3.5 bg-gray-50/80 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 transition-all duration-300 hover:border-gray-300"
                    />
                  </div>
                </div>

                {errors.submit && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {errors.submit}
                  </div>
                )}

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    <ArrowLeft size={18} />
                    <span>Back</span>
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        <span>Creating account...</span>
                      </>
                    ) : (
                      <>
                        <span>Create Account</span>
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-medium text-gray-900 hover:underline transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumSignup;
