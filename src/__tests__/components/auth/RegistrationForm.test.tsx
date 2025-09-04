import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { signIn } from "next-auth/react";
import RegistrationForm from "@/components/auth/RegistrationForm";

jest.mock("next-auth/react");

const mockSignIn = signIn as jest.MockedFunction<typeof signIn>;

describe("RegistrationForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock environment variable check
    process.env.NEXT_PUBLIC_DB_CONFIGURED = "true";
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_DB_CONFIGURED;
  });

  describe("Database Configuration", () => {
    it("shows database configuration warning when DB is not configured", () => {
      delete process.env.NEXT_PUBLIC_DB_CONFIGURED;

      render(<RegistrationForm />);

      expect(
        screen.getByText(
          "Database configuration required to use authentication."
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Please set up your environment variables/)
      ).toBeInTheDocument();
      expect(screen.queryByText("Email Address")).not.toBeInTheDocument();
    });

    it("shows registration form when database is configured", () => {
      render(<RegistrationForm />);

      expect(screen.getByText("Marathon Training Planner")).toBeInTheDocument();
      expect(screen.getByLabelText("Email Address")).toBeInTheDocument();
      expect(screen.getByLabelText("Password")).toBeInTheDocument();
      expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Create Account" })
      ).toBeInTheDocument();
      expect(screen.getByText(/Already have an account/)).toBeInTheDocument();
    });
  });

  describe("Form Validation", () => {
    it("has HTML5 validation for required fields and password length", () => {
      render(<RegistrationForm />);

      const emailInput = screen.getByLabelText(
        "Email Address"
      ) as HTMLInputElement;
      const passwordInput = screen.getByLabelText(
        "Password"
      ) as HTMLInputElement;
      const confirmPasswordInput = screen.getByLabelText(
        "Confirm Password"
      ) as HTMLInputElement;

      expect(emailInput.required).toBe(true);
      expect(passwordInput.required).toBe(true);
      expect(confirmPasswordInput.required).toBe(true);
      expect(passwordInput.minLength).toBe(6);
      expect(confirmPasswordInput.minLength).toBe(6);
    });

    it("shows error when passwords do not match", async () => {
      const user = userEvent.setup();
      render(<RegistrationForm />);

      const emailInput = screen.getByLabelText("Email Address");
      const passwordInput = screen.getByLabelText("Password");
      const confirmPasswordInput = screen.getByLabelText("Confirm Password");
      const createButton = screen.getByRole("button", {
        name: "Create Account",
      });

      // Fill all fields but make passwords not match (this JS validation HTML5 can't handle)
      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.type(confirmPasswordInput, "differentpassword");
      await user.click(createButton);

      expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
      expect(mockSignIn).not.toHaveBeenCalled();
    });
  });

  describe("Account Creation", () => {
    it("calls signIn with correct parameters for signup", async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValue({ ok: true, error: null } as Awaited<
        ReturnType<typeof signIn>
      >);

      render(<RegistrationForm />);

      const emailInput = screen.getByLabelText("Email Address");
      const passwordInput = screen.getByLabelText("Password");
      const confirmPasswordInput = screen.getByLabelText("Confirm Password");
      const createButton = screen.getByRole("button", {
        name: "Create Account",
      });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.type(confirmPasswordInput, "password123");
      await user.click(createButton);

      expect(mockSignIn).toHaveBeenCalledWith("credentials", {
        email: "test@example.com",
        password: "password123",
        action: "signup",
        redirect: false,
      });
    });

    it("shows success message when account is created", async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValue({ ok: true, error: null } as Awaited<
        ReturnType<typeof signIn>
      >);

      render(<RegistrationForm />);

      const emailInput = screen.getByLabelText("Email Address");
      const passwordInput = screen.getByLabelText("Password");
      const confirmPasswordInput = screen.getByLabelText("Confirm Password");
      const createButton = screen.getByRole("button", {
        name: "Create Account",
      });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.type(confirmPasswordInput, "password123");
      await user.click(createButton);

      await waitFor(() => {
        expect(
          screen.getByText("Account created successfully! Redirecting...")
        ).toBeInTheDocument();
      });
    });

    it("shows error message when user already exists", async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValue({
        ok: false,
        error: "CredentialsSignin User already exists",
      } as Awaited<ReturnType<typeof signIn>>);

      render(<RegistrationForm />);

      const emailInput = screen.getByLabelText("Email Address");
      const passwordInput = screen.getByLabelText("Password");
      const confirmPasswordInput = screen.getByLabelText("Confirm Password");
      const createButton = screen.getByRole("button", {
        name: "Create Account",
      });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.type(confirmPasswordInput, "password123");
      await user.click(createButton);

      await waitFor(() => {
        expect(
          screen.getByText(
            "An account with this email already exists. Try signing in instead."
          )
        ).toBeInTheDocument();
      });
    });

    it("shows loading state during submission", async () => {
      const user = userEvent.setup();
      mockSignIn.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<RegistrationForm />);

      const emailInput = screen.getByLabelText("Email Address");
      const passwordInput = screen.getByLabelText("Password");
      const confirmPasswordInput = screen.getByLabelText("Confirm Password");
      const createButton = screen.getByRole("button", {
        name: "Create Account",
      });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.type(confirmPasswordInput, "password123");
      await user.click(createButton);

      expect(screen.getByText("Creating Account...")).toBeInTheDocument();
      expect(createButton).toBeDisabled();
    });
  });
});
