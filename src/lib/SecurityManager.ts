export const SecurityManager = {
  isPasswordSet: (moduleId: string) => {
    return !!localStorage.getItem(`module_password_${moduleId}`);
  },
  setPassword: (moduleId: string, password: string) => {
    localStorage.setItem(`module_password_${moduleId}`, password);
  },
  validatePassword: (moduleId: string, password: string) => {
    return localStorage.getItem(`module_password_${moduleId}`) === password;
  },
  saveSecurityQuestion: (moduleId: string, question: string, answer: string) => {
    localStorage.setItem(`module_security_question_${moduleId}`, question);
    localStorage.setItem(`module_security_answer_${moduleId}`, answer);
  },
  getSecurityQuestion: (moduleId: string) => {
    return localStorage.getItem(`module_security_question_${moduleId}`) || "What is your pet's name?";
  },
  validateSecurityAnswer: (moduleId: string, answer: string) => {
    return localStorage.getItem(`module_security_answer_${moduleId}`) === answer;
  },
  resetPassword: (moduleId: string) => {
    localStorage.removeItem(`module_password_${moduleId}`);
  }
};
