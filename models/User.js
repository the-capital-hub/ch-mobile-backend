import mongoose, { Schema, model } from "mongoose";
import { hashPassword } from "../utils/passwordManager.js";

// Collection sub-schema
const collectionSchema = new Schema(
	{
		name: { type: String, required: true },
		posts: [{ type: Schema.Types.ObjectId, ref: "Posts" }],
	},
	{ timestamps: true }
);

// Function to generate random number for oneLinkId
function generateRandomNumber() {
	return Math.floor(100000 + Math.random() * 900000).toString();
}

// Function to update the total experience field (yearsOfExperience) based on recentExperience
function calculateTotalExperience(recentExperience) {
	if (!recentExperience || !recentExperience.length) return 0;

	let totalYears = 0;
	const currentDate = new Date();

	recentExperience.forEach((exp) => {
		if (exp.experienceDuration?.startYear && exp.experienceDuration?.endYear) {
			const startDate = new Date(exp.experienceDuration.startYear);
			const endDate =
				new Date(exp.experienceDuration.endYear) > currentDate
					? currentDate
					: new Date(exp.experienceDuration.endYear);

			const years = (endDate - startDate) / (1000 * 60 * 60 * 24 * 365.25);
			totalYears += Math.max(0, years);
		}
	});

	return `${Math.round(totalYears * 10) / 10} years`;
}

function getLatestExperienceDetails(recentExperience) {
	if (!recentExperience || !recentExperience.length) return null;

	// Sort experiences by endYear in descending order
	const sortedExperiences = [...recentExperience].sort((a, b) => {
		const aEnd = a.experienceDuration?.endYear
			? new Date(a.experienceDuration.endYear)
			: new Date();
		const bEnd = b.experienceDuration?.endYear
			? new Date(b.experienceDuration.endYear)
			: new Date();
		return bEnd - aEnd;
	});

	// Return the latest experience
	return {
		companyName: sortedExperiences[0].companyName || "",
		designation: sortedExperiences[0].role || "",
	};
}

// Main user schema
const userSchema = new Schema(
	{
		// Basic Info
		firstName: { type: String, trim: true },
		lastName: { type: String, trim: true },
		userName: { type: String },
		email: { type: String, trim: true, lowercase: true },
		password: { type: String },
		phoneNumber: { type: String },
		gender: { type: String },
		location: { type: String, trim: true },
		profilePicture: {
			type: String,
			default:
				"https://res.cloudinary.com/drjt9guif/image/upload/v1723448166/TheCapitalHub/startUps/logos/viprylq9wb7e4qx6u8dt.webp",
		},
		bio: { type: String, trim: true },

		// Professional Info
		companyName: { type: String, trim: true }, //new field
		designation: { type: String },
		industry: { type: String },
		yearsOfExperience: { type: String }, // dynamically updated from recent exp.
		// Experience & Education Details (Legacy fields)
		experience: { String }, // industry exp.
		education: { type: String, trim: true },

		recentExperience: [
			{
				logo: String,
				companyName: String,
				location: String,
				experienceDuration: {
					startYear: Date,
					endYear: Date,
				},
				role: String,
				description: String,
			},
		],
		recentEducation: [
			{
				logo: String,
				schoolName: String,
				course: String,
				passoutYear: Date,
				location: String,
				description: String,
			},
		],

		// LinkedIn Integration
		linkedinId: { type: String },
		linkedinTokenExpiryDate: { type: Date },
		linkedin: { type: String },
		linkedinToken: { type: String },

		// Connections
		connections: [{ type: Schema.Types.ObjectId, ref: "Users" }],
		connectionsSent: [{ type: Schema.Types.ObjectId, ref: "Users" }],
		connectionsReceived: [{ type: Schema.Types.ObjectId, ref: "Users" }],
		blockedUsers: [{ type: Schema.Types.ObjectId, ref: "Users" }],

		// Posts & Collections
		savedPosts: [collectionSchema],
		featuredPosts: [{ type: Schema.Types.ObjectId, ref: "Posts" }],
		companyUpdate: [{ type: Schema.Types.ObjectId, ref: "Posts" }],

		// Investor Related
		isInvestor: { type: String, default: false },
		isVc: { type: Boolean, default: false },
		investor: { type: Schema.Types.ObjectId, ref: "Investors" },
		investmentSize: { type: String },
		investmentStage: { type: String },
		sectorPreferences: [{ type: String }],
		investmentPhilosophy: { type: String },
		philosophy: {
			importanceOfManagement: String,
			roleAsAInvestor: String,
			founderAlmaMaterMatters: String,
			riskManagementInInvestments: String,
			guideOnSellingInvestments: String,
			timingInInvestmentDecisions: String,
			macroeconomicFactorsInfluenceInvestments: String,
			assessCompanyCompetitiveAdvantage: String,
			industryTrendsHoldInYourStrategy: String,
			evaluateCompanyGrowthPotential: String,
			weightGaveToTechnologicalInnovation: String,
		},

		// Startup Related
		startUp: { type: Schema.Types.ObjectId, ref: "StartUps" },
		previousExits: { type: String },
		diversityMetrics: [{ type: String }],
		fundingViaCapitalhubQuestions: {
			targetMarket: String,
			whyRightTimeForYourStartUp: String,
			competitiveAdvantage: String,
			biggestCompetitors: String,
			revenueGenerated: String,
		},

		// Chat & Communication
		pinnedChat: [{ type: Schema.Types.ObjectId, ref: "Chats" }],
		meetingToken: { type: Object },
		Availability: { type: Schema.Types.Boolean, ref: "Availability" },
		priorityDMPrice: { type: Number, default: 99 },

		// Achievements & Events
		achievements: [{ type: Schema.Types.ObjectId, ref: "Achievement" }],
		eventId: [{ type: Schema.Types.ObjectId, ref: "Events" }],
		webinars: [{ type: Schema.Types.ObjectId, ref: "Webinars" }],

		// Account Status & Settings
		userStatus: { type: String, default: "active" },
		oneLinkId: {
			type: String,
			default: generateRandomNumber,
			unique: true,
		},
		secretKey: { type: String },
		isAdmin: { type: Boolean, default: false },
		isTopVoice: {
			status: { type: Boolean, default: false },
			expiry: { type: Date },
		},

		// Subscription
		subReferenceId: { type: String },
		subscriptionType: {
			type: String,
			enum: ["Basic", "Standard", "Pro"],
			default: "Basic",
		},
		isSubscribed: { type: Boolean, default: false },
		trialStartDate: { type: Date },
		investorIdCount: [{ type: String }],

		userType: {
			type: String,
			enum: ['startup founder', 'startup employee', 'investor', 'vc', 'student', 'raw']
		},
		registeredFrom: {
			type: String,
			default: '/signUp',
		},
	},
	{
		timestamps: true,
	}
);

// Add middleware to track changes in recentExperience
userSchema.pre("save", function (next) {
	// Check if recentExperience is modified
	if (this.isModified("recentExperience")) {
		// Calculate total experience
		this.yearsOfExperience = calculateTotalExperience(this.recentExperience);

		// Update company and designation from latest experience
		const latestExp = getLatestExperienceDetails(this.recentExperience);
		if (latestExp) {
			this.companyName = latestExp.companyName;
			this.designation = latestExp.designation;
		}
	}
	next();
});

userSchema.post(
	["findOneAndUpdate", "updateOne", "updateMany"],
	async function (doc) {
		// Only proceed if recentExperience was modified
		const update = this.getUpdate();
		if (update && (update.$set?.recentExperience || update.recentExperience)) {
			const docToUpdate = await this.model.findOne(this.getQuery());
			if (docToUpdate) {
				// Calculate new values
				const yearsExp = calculateTotalExperience(docToUpdate.recentExperience);
				const latestExp = getLatestExperienceDetails(
					docToUpdate.recentExperience
				);

				// Update all fields in one operation
				await this.model.updateOne(
					{ _id: docToUpdate._id },
					{
						$set: {
							yearsOfExperience: yearsExp,
							companyName: latestExp?.companyName || docToUpdate.companyName,
							designation: latestExp?.designation || docToUpdate.designation,
						},
					}
				);
			}
		}
	}
);

export const UserModel = model("Users", userSchema);
