const {
  AuthenticationError,
  UserInputError,
  ApolloError,
} = require("apollo-server-express");
const {
  User,
  AccommodationCards,
  InterventionList,
  Frequency,
  Duration,
} = require("../models");
const { signToken } = require("../utils/auth");
const moment = require("moment");
const { startOfDay, endOfDay, isEqual } = require("date-fns");
const mongoose = require("mongoose");

    
const addFrequencyToTrackForStudent= async (_, { frequencyId, studentId }, context) => {
  console.log('addFrequencyToTrackForStudent resolver called with frequencyId:', frequencyId, 'and studentId:', studentId);
  if (!context.user || !context.user.isAdmin) {
    throw new AuthenticationError(
      "You must be logged in as an administrator!",
    );
  }

  if (!studentId) {
    throw new UserInputError("Student ID is required");
  }

  try {
    // Find the frequency document
    const frequency = await Frequency.findById(frequencyId);
    if (!frequency) {
      throw new UserInputError("Frequency not found");
    }

    // Find the user document (student)
    const user = await User.findById(studentId);
    if (!user) {
      throw new UserInputError("Student not found");
    }

    // Update the user document to include the frequency
    user.behaviorFrequencies.push(frequencyId);
    await user.save();

    return user;
  } catch (error) {
    throw new ApolloError(
      "Failed to add frequency of behavior for student",
      "ADD_FREQUENCY_ERROR",
      { originalError: error },
    );
  }
}


// const removeFrequencyBeingTrackedForStudent= async (parent, args, context) => {
//   if (!context.user || !context.user.isAdmin) {
//     throw new AuthenticationError("You need to be logged in as an admin!");
//   }

//   const { frequencyId, studentId } = args;

//   if (!studentId) {
//     throw new UserInputError("Student ID is required");
//   }

//   try {
//     const user = await User.findById(studentId);

//     if (!user) {
//       throw new UserInputError("Student not found");
//     }

//     const index = user.behaviorFrequencies.indexOf(frequencyId);
//     if (index === -1) {
//       throw new UserInputError(
//         "Accommodation card not found for this student!",
//       );
//     }

//     user.behaviorFrequencies.splice(index, 1);
//     await user.save();

//     return user;
//   } catch (error) {
//     throw new ApolloError(
//       "Failed to remove accommodation from student",
//       "REMOVE_ACCOMMODATION_ERROR",
//       { originalError: error },
//     );
//   }
// },

const addDurationToTrackForStudent= async (_, { durationId, studentId }, context) => {
  console.log('addDurationToTrackForStudent resolver called with durationId:', durationId, 'and studentId:', studentId);
  if (!context.user || !context.user.isAdmin) {
    throw new AuthenticationError(
      "You must be logged in as an administrator!",
    );
  }

  if (!studentId) {
    throw new UserInputError("Student ID is required");
  }

  try {
    const duration = await Duration.findById(durationId);
    if (!duration) {
      throw new UserInputError('Duration not found')
    }
    

    // Find the user document (student)
    const user = await User.findById(studentId);
    if (!user) {
      throw new UserInputError("Student not found");
    }

    // Update the user document to include the new duration
    user.behaviorDurations.push(durationId);
    await user.save();

    return user;
  } catch (error) {
    throw new ApolloError(
      "Failed to add duration of behavior for student",
      "ADD_DURATION_ERROR",
      { originalError: error },
    );
  }
}

// const removeDurationBeingTrackedForStudent= async (parent, args, context) => {
//   if (!context.user || !context.user.isAdmin) {
//     throw new AuthenticationError("You need to be logged in as an admin!");
//   }

//   const { durationId, studentId } = args;

//   if (!studentId) {
//     throw new UserInputError("Student ID is required");
//   }

//   try {
//     const user = await User.findById(studentId);

//     if (!user) {
//       throw new UserInputError("Student not found");
//     }

//     const index = user.behaviorDurations.indexOf(durationId);
//     if (index === -1) {
//       throw new UserInputError("Duration not found for this student!");
//     }

//     user.behaviorDurations.splice(index, 1);
//     await user.save();

//     return user;
//   } catch (error) {
//     throw new ApolloError(
//       "Failed to remove duration from student",
//       "REMOVE_DURATION_ERROR",
//       { originalError: error },
//     );
//   }
// },

const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      if (context.user) {
        const userData = await User.findOne({ _id: context.user._id })
          .select("-__v -password")
          .populate("isAdmin")
          .populate('firstName')
          .populate('lastName')
          .populate("studentSchoolId")
          .populate("students")
          .populate("accommodations")
          .populate("behaviorFrequencies")
          .populate("behaviorDurations")
          .populate("interventions");

        return userData;
      }
      throw new AuthenticationError("Not logged in");
    },

    users: async () => {
      return User.find().select("-__v -password");
    },
    user: async (_, { identifier, isUsername }) => {
      try {
        let user;
        if (isUsername) {
          user = await User.findOne({ username: identifier }).populate('behaviorFrequencies');
        } else {
          user = await User.findById(identifier).populate('behaviorFrequencies');
        }
        
        console.log('Populated user:', user); // Log the populated user object
    
        // Calculate the count for each behavior frequency
        const populatedBehaviorFrequencies = user.behaviorFrequencies.map((behaviorFrequency) => {
          const count = behaviorFrequency.log.length > 0 ? behaviorFrequency.log.length : 0; // Check if log array is not empty
          return {
            ...behaviorFrequency.toObject(),
            count: count,
          };
        });
    
        return {
          ...user.toObject(),
          behaviorFrequencies: populatedBehaviorFrequencies,
        };
      } catch (error) {
        throw new Error('Error fetching user data');
      }
    },
    
    
    
    
    admins: async () => {
      try {
        const adminUsers = await User.find({ isAdmin: true });
        return adminUsers;
      } catch (error) {
        console.error("Error fetching admin users: ", error);
        throw error;
      }
    },

    students: async () => {
      try {
        const studentUsers = await User.find({ isAdmin: false });
        return studentUsers;
      } catch (error) {
        console.error("Error fetching student users: ", error);
      }
      throw error;
    },

    accommodationCards: async () => {
      return AccommodationCards.find();
    },

    //need data to check these
    frequency: async () => {
      try {
        // Your code to fetch frequencies from the database
        const frequencies = await Frequency.find(); // Example code, replace with your actual implementation

        // Map over the frequencies and replace null count with 0
        const frequenciesWithCountZero = frequencies.map(frequency => ({
          ...frequency.toObject(),
          count: frequency.count || 0, // If count is null, replace with 0
        }));

        return frequenciesWithCountZero;
      } catch (error) {
        throw new Error('Failed to fetch frequencies');
      }
    },

    //need data to check these
    duration: async () => {
      return Duration.find();
    },

    interventionList: async () => {
      const interventionList = await InterventionList.find();
      // Filter out records where createdBy is null
      return interventionList.filter((item) => item.createdBy !== null);
    },

    //need data to check these
    // interventionList: async (parent, { username }) => {
    //   const params = username ? { username } : {};
    //   if (!params) {
    //     throw new Error('User not found');
    //   }
    //   return InterventionList.find(params)
    // },
  },

  Mutation: {
    addUser: async (parent, args) => {
      const user = await User.create(args);
      const token = signToken(user);

      return { token, user };
    },

    login: async (parent, { username, password }) => {
      const user = await User.findOne({ username });

      if (!user) {
        throw new AuthenticationError("Incorrect credentials");
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new AuthenticationError("Incorrect credentials");
      }

      const token = signToken(user);
      return { token, user };
    },

    removeUser: async (parent, args, context) => {
      if (!context.user || !context.user.isAdmin) {
        throw new AuthenticationError("You need to be logged in as an admin!");
      }

      try {
        const user = await User.findByIdAndDelete(args._id);

        if (!user) {
          throw new Error("Accommodation card not found");
        }

        console.log(user);

        return user;
      } catch (error) {
        throw new ApolloError(
          "Failed to delete accommodation card",
          "DELETE_ACCOMMODATION_CARD_ERROR",
          { originalError: error },
        );
      }
    },

    addStudentToTeacherList: async (parent, { studentId }, context) => {
      if (context.user) {
        const updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $addToSet: { students: studentId } },
          { new: true }
        ).populate('students');
    
        return updatedUser;
      }
    
      throw new AuthenticationError('You need to be logged in as an admin!');
    },
    removeStudentFromTeacherList: async (parent, { studentId }, context) => {
      if (context.user && context.user.isAdmin) {
        const updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $pull: { students:  studentId }},
          { new: true }
        ).populate('students');
    
        return updatedUser;
      }
    
      throw new AuthenticationError('You need to be logged in as an admin!');
    },

    addAccommodationCard: async (parent, args, context) => {
      if (!context.user || !context.user.isAdmin) {
        throw new AuthenticationError(
          "You must be logged in as an admin to perform this action.",
        );
      }

      args.createdBy = context.user._id;

      const accommodationCard = await AccommodationCards.create(args);

      return accommodationCard;
    },

    removeAccommodationCard: async (parent, args, context) => {
      if (!context.user || !context.user.isAdmin) {
        throw new AuthenticationError("You need to be logged in as an admin!");
      }

      try {
        const accommodationCard = await AccommodationCards.findByIdAndDelete(
          args._id,
        );

        if (!accommodationCard) {
          throw new Error("Accommodation card not found");
        }

        console.log(accommodationCard);

        return accommodationCard;
      } catch (error) {
        throw new ApolloError(
          "Failed to delete accommodation card",
          "DELETE_ACCOMMODATION_CARD_ERROR",
          { originalError: error },
        );
      }
    },
    addFrequencyTitleToList: async (_, args, context) => {
        if (!context.user || !context.user.isAdmin) {
          throw new AuthenticationError(
            "You must be logged in as an administrator!",
          );
        }
        args.createdBy = context.user._id;

        const frequency = await Frequency.create(args);
        return frequency;
      },
      removeFrequencyTitleFromList: async (parent, args, context) => {
        if (!context.user || !context.user.isAdmin) {
          throw new AuthenticationError("You need to be logged in as an admin")
        }
        try {
          const frequency = await Frequency.findByIdAndDelete(
            args._id,
          )
          if (!frequency) {
            throw new Error ("Frequency card not found")
          }
          console.log(frequency);
          return frequency;
        } catch (error) {
          throw new ApolloError(
            "Failed to delete frequency title",
            "DELETE_FREQUENCY_TITLE_ERROR",
            { originalError: error}
          )
        }
      },
      addDurationTitleToList: async (_, args, context) => {
        if (!context.user || !context.user.isAdmin) {
          throw new AuthenticationError(
            "You must be logged in as an administrator!",
          );
        }
        args.createdBy = context.user._id;

        const duration = await Duration.create(args);
        return duration;
      },
      removeDurationTitleFromList: async (parent, args, context) => {
        if (!context.user || !context.user.isAdmin) {
          throw new AuthenticationError("You need to be logged in as an admin")
        }
        try {
          const duration = await Duration.findByIdAndDelete(
            args._id,
          )
          if (!duration) {
            throw new Error ("duration card not found")
          }
          console.log(duration);
          return duration;
        } catch (error) {
          throw new ApolloError(
            "Failed to delete duration title",
            "DELETE_DURATION_TITLE_ERROR",
            { originalError: error}
          )
        }
      },
   
   
    addAccommodationForStudent: async (_, args, context) => {
      console.log("Starting addAccommodationForStudent resolver");
      console.log("Received arguments:", args);

      if (!context.user || !context.user.isAdmin) {
        throw new AuthenticationError(
          "You must be logged in as an administrator!",
        );
      }

      const { accommodationCardId, studentId } = args;

      if (!studentId) {
        throw new UserInputError("Student ID is required");
      }

      try {
        console.log("Finding accommodation card with ID:", accommodationCardId);

        const objectIdAccommodationCardId =
          mongoose.Types.ObjectId(accommodationCardId);

        const accommodationCard = await AccommodationCards.findById(
          objectIdAccommodationCardId,
        );

        if (!accommodationCard) {
          throw new Error("Accommodation card not found");
        }

        console.log("Found accommodation card:", accommodationCard);

        accommodationCard.createdBy = context.user._id;

        await accommodationCard.save();

        console.log("Finding user with ID:", studentId);
        const user = await User.findById(studentId);

        if (!user) {
          throw new Error("User not found");
        }

        console.log("Found user:", user);

        console.log("Adding accommodation card to user's accommodations array");
        user.accommodations.push(objectIdAccommodationCardId);

        console.log("Saving updated user");
        await user.save();

        console.log("User successfully updated:", user);

        return user;
      } catch (error) {
        console.error("Error occurred:", error);
        throw new ApolloError(
          "Failed to add accommodation for student",
          "ADD_ACCOMMODATION_ERROR",
          { originalError: error },
        );
      }
    },

    removeAccommodationFromStudent: async (parent, args, context) => {
      if (!context.user || !context.user.isAdmin) {
        throw new AuthenticationError("You need to be logged in as an admin!");
      }

      const { accommodationCardId, studentId } = args;

      if (!studentId) {
        throw new UserInputError("Student ID is required");
      }

      try {
        const user = await User.findById(studentId);

        if (!user) {
          throw new UserInputError("Student not found");
        }

        const index = user.accommodations.indexOf(accommodationCardId);
        if (index === -1) {
          throw new UserInputError(
            "Accommodation card not found for this student!",
          );
        }

        user.accommodations.splice(index, 1);
        await user.save();

        return user;
      } catch (error) {
        throw new ApolloError(
          "Failed to remove accommodation from student",
          "REMOVE_ACCOMMODATION_ERROR",
          { originalError: error },
        );
      }
    }, 
      
    
    // addFrequencyToTrackForStudent: async (_, { frequencyId, studentId }, context) => {
    //   if (!context.user || !context.user.isAdmin) {
    //     throw new AuthenticationError(
    //       "You must be logged in as an administrator!",
    //     );
    //   }
    
    //   if (!studentId) {
    //     throw new UserInputError("Student ID is required");
    //   }
    
    //   try {
    //     // Find the frequency document
    //     const frequency = await Frequency.findById(frequencyId);
    //     if (!frequency) {
    //       throw new UserInputError("Frequency not found");
    //     }
    
    //     // Find the user document (student)
    //     const user = await User.findById(studentId);
    //     if (!user) {
    //       throw new UserInputError("Student not found");
    //     }
    
    //     // Update the user document to include the frequency
    //     user.behaviorFrequencies.push(frequencyId);
    //     await user.save();
    
    //     return user;
    //   } catch (error) {
    //     throw new ApolloError(
    //       "Failed to add frequency of behavior for student",
    //       "ADD_FREQUENCY_ERROR",
    //       { originalError: error },
    //     );
    //   }
    // },
    

    removeFrequencyBeingTrackedForStudent: async (parent, args, context) => {
      if (!context.user || !context.user.isAdmin) {
        throw new AuthenticationError("You need to be logged in as an admin!");
      }

      const { frequencyId, studentId } = args;

      if (!studentId) {
        throw new UserInputError("Student ID is required");
      }

      try {
        const user = await User.findById(studentId);

        if (!user) {
          throw new UserInputError("Student not found");
        }

        const index = user.behaviorFrequencies.indexOf(frequencyId);
        if (index === -1) {
          throw new UserInputError(
            "Accommodation card not found for this student!",
          );
        }

        user.behaviorFrequencies.splice(index, 1);
        await user.save();

        return user;
      } catch (error) {
        throw new ApolloError(
          "Failed to remove accommodation from student",
          "REMOVE_ACCOMMODATION_ERROR",
          { originalError: error },
        );
      }
    },

    // addDurationToTrackForStudent: async (_, { behaviorTitle, operationalDefinition, studentId }, context) => {
    //   if (!context.user || !context.user.isAdmin) {
    //     throw new AuthenticationError(
    //       "You must be logged in as an administrator!",
    //     );
    //   }
    
    //   if (!studentId) {
    //     throw new UserInputError("Student ID is required");
    //   }
    
    //   try {
    //     // Create a new Duration document
    //     const newDuration = await Duration.create({
    //       behaviorTitle,
    //       operationalDefinition,
    //       duration: 0,
    //       createdAt: new Date(),
    //       createdBy: context.user._id,
    //       createdFor: studentId,
    //     });
    
    //     // Find the user document (student)
    //     const user = await User.findById(studentId);
    //     if (!user) {
    //       throw new UserInputError("Student not found");
    //     }
    
    //     // Update the user document to include the new duration
    //     user.behaviorDurations.push(newDuration._id);
    //     await user.save();
    
    //     return user;
    //   } catch (error) {
    //     throw new ApolloError(
    //       "Failed to add duration of behavior for student",
    //       "ADD_DURATION_ERROR",
    //       { originalError: error },
    //     );
    //   }
    // },
    
    removeDurationBeingTrackedForStudent: async (parent, args, context) => {
      if (!context.user || !context.user.isAdmin) {
        throw new AuthenticationError("You need to be logged in as an admin!");
      }

      const { durationId, studentId } = args;

      if (!studentId) {
        throw new UserInputError("Student ID is required");
      }

      try {
        const user = await User.findById(studentId);

        if (!user) {
          throw new UserInputError("Student not found");
        }

        const index = user.behaviorDurations.indexOf(durationId);
        if (index === -1) {
          throw new UserInputError("Duration not found for this student!");
        }

        user.behaviorDurations.splice(index, 1);
        await user.save();

        return user;
      } catch (error) {
        throw new ApolloError(
          "Failed to remove duration from student",
          "REMOVE_DURATION_ERROR",
          { originalError: error },
        );
      }
    },

    addDataMeasureToStudent: async (_, { dataMeasureId, studentId }, context) => {
      console.log('addDataMeasureToStudent resolver called with dataMeasureId:', dataMeasureId, 'and studentId:', studentId);
  
      if (!context.user || !context.user.isAdmin) {
        throw new AuthenticationError("You must be logged in as an administrator!");
      }
      
      try {
        let frequency, duration;
    
        // Check if dataMeasureId matches a frequency
        try {
          frequency = await Frequency.findById(dataMeasureId);
          console.log('Frequency found:', frequency);
        } catch (frequencyError) {
          console.error('Error finding frequency:', frequencyError);
          // If not a frequency, try finding a duration
        }
          try {
            duration = await Duration.findById(dataMeasureId);
            console.log('Duration found:', duration);
          } catch (durationError) {
            console.error('Error finding duration:', durationError);
            throw new Error("Data measure not found or does not exist");
          }
        
    
        // Proceed based on whether frequency or duration was found
        if (frequency) {
          console.log('Adding frequency to track for student:', frequency);
          return await addFrequencyToTrackForStudent(_, { frequencyId: dataMeasureId, studentId }, context);
        } else if (duration) {
          console.log('Adding duration to track for student:', duration);
          console.log('Passing durationId:', dataMeasureId);
          return await addDurationToTrackForStudent(_, { durationId: dataMeasureId, studentId }, context);
        }
      } catch (error) {
        console.error('Error in addDataMeasureToStudent resolver:', error);
        throw new ApolloError(
          "Failed to add data measure to student",
          "ADD_DATA_MEASURE_ERROR",
          { originalError: error },
        );
      }
    },

    frequencyIncreased: async (parent, args, context) => {
      if (!context.user) {
        throw new AuthenticationError("You must be logged in!");
      }
    
      const { frequencyId, studentId } = args;
    
      if (!frequencyId || !studentId) {
        throw new UserInputError("Frequency ID and Student ID are required");
      }
    
      try {
        // Find the frequency document associated with the given frequencyId and studentId
        const frequency = await Frequency.findOne({ _id: frequencyId, createdFor: studentId });
    
        if (!frequency) {
          throw new UserInputError("Frequency not found for the specified student");
        }
    
        // Ensure that count is a valid numeric value before incrementing
        if (typeof frequency.count !== 'number' || isNaN(frequency.count)) {
          // Initialize count with a valid numeric value (e.g., 0)
          frequency.count = 0;
        }
    
        // Increment the count for the specific frequency document
        frequency.count++;
        frequency.updatedAt = new Date();
        frequency.log.push({ time: new Date() });
        await frequency.save();
    
        // Update the user's behaviorFrequencies array
        const user = await User.findById(studentId);
        if (!user) {
          throw new UserInputError("Student not found");
        }
    
        const updatedBehaviorFrequencies = user.behaviorFrequencies.map(behavior => {
          if (behavior._id.toString() === frequencyId) {
            // Increment the count for the corresponding behavior frequency
            behavior.count++;
          }
          return behavior;
        });
    
        user.behaviorFrequencies = updatedBehaviorFrequencies;
        await user.save();
    
        return frequency;
      } catch (error) {
        throw new ApolloError(
          "Failed to increase frequency count",
          "FREQUENCY_INCREASE_ERROR",
          { originalError: error },
        );
      }
    },
    
    

    removeFrequencyIncrement: async (parent, args, context) => {
      if (!context.user) {
        throw new AuthenticationError("You must be logged in!");
      }

      const { frequencyId, studentId } = args;

      if (!frequencyId || !studentId) {
        throw new UserInputError("Frequency ID and Student ID are required");
      }
      try {
        const frequency = await Frequency.findById(frequencyId);
        const user = await User.findById(studentId);

        if (!frequency) {
          throw new UserInputError("Frequency not found");
        }
        if (!user) {
          throw new UserInputError("Student not found");
        }
        frequency.count--;
        frequency.log.pop();
        await frequency.save();

        return frequency;
      } catch (error) {
        throw new ApolloError(
          "Failed to increase frequency count",
          "FREQUENCY_INCREASE_ERROR",
          { originalError: error },
        );
      }
    },

    startDurationTimer: async (parent, args, context) => {
      try {
        // Check if user is logged in
        if (!context.user) {
          throw new Error("User not logged in.");
        }

        const { durationId, studentId } = args;

        if (!durationId || !studentId) {
          throw new UserInputError("Duration ID and Student ID are required");
        }

        // Retrieve the duration document
        const duration = await Duration.findById(durationId);

        // Check if the duration exists
        if (!duration) {
          throw new UserInputError("Duration not found");
        }

        // Generate a new ObjectId for the start duration ID
        const startDurationId = new mongoose.Types.ObjectId();

        // Update the start time of the duration
        duration.startTimes.push(new Date());

        // Associate the duration with the logged-in user
        duration.createdBy = context.user._id;

        // Associate the start time with the duration
        duration.startDurationId.push([startDurationId]);

        // Save the changes to the duration document
        await duration.save();

        // Retrieve the user document
        const user = await User.findById(studentId);

        // Check if the user exists
        if (!user) {
          throw new UserInputError("Student not found");
        }

        // Add the duration ID to the behaviorDurations array of the user
        user.behaviorDurations.push(duration._id);

        // Save the changes to the user document
        await user.save();

        // Return the updated user
        return user;
      } catch (error) {
        console.error("Failed to start duration timer:", error.message);
        throw new Error(
          "Failed to start duration timer. Please try again later.",
        );
      }
    },

    endDurationTimer: async (
      parent,
      { durationId, startDurationId },
      context,
    ) => {
      // Check if user is logged in
      if (!context.user) {
        throw new Error("User not logged in.");
      }

      try {
        // Find the duration entry by ID
        const duration = await Duration.findById(durationId);

        // Check if the duration exists
        if (!duration) {
          throw new Error("Duration not found.");
        }

        // Find the index of the startDurationId within the startDurationId array
        const index = duration.startDurationId.findIndex(
          (id) => id.toString() === startDurationId,
        );

        // Check if the startDurationId exists in the array
        if (index === -1) {
          throw new Error("Start time not found for the given duration.");
        }

        // Associate the end time with the corresponding start time
        duration.endTimes[index] = new Date();

        // Save the changes to the duration document
        await duration.save();

        // Return the updated duration entry
        return duration;
      } catch (error) {
        console.error(error);
        throw new Error("Failed to end duration timer.");
      }
    },

    removeLastDurationTimer: async (parent, args, context) => {
      // Check if user is logged in
      if (!context.user) {
        throw new Error("User not logged in.");
      }

      try {
        // Find the last duration entry created by the user and who it was created for then remove it
        //can I just remove the duration id since that is what will be updated with all thisinfo?
        const lastDuration = await Duration.findByIdAndDelete(args._id);

        // If no duration found
        if (!lastDuration) {
          throw new Error("No duration found to remove.");
        }

        // Return the ID of the removed duration entry
        return {
          id: lastDuration._id,
        };
      } catch (error) {
        console.error(error);
        throw new Error("Failed to remove last duration timer.");
      }
    },

    addToInterventionList: async (parent, args, context) => {
      if (!context.user || !context.user.isAdmin) {
        throw new AuthenticationError("You must be logged in as an admin");
      }
      args.createdBy = context.user._id;
      const interventionItem = await InterventionList.create(args);
      return interventionItem;
    },

    removedInterventionFromList: async (parent, args, context) => {
      if (!context.user || !context.user.isAdmin) {
        throw new AuthenticationError("You need to be logged in as an admin");
      }
      try {
        const interventionItem = await InterventionList.findByIdAndDelete(
          args._id,
        );
        if (!interventionItem) {
          throw new Error("Intervention was not found");
        }
        console.log(interventionItem);
        return interventionItem;
      } catch (error) {
        throw new ApolloError(
          "Failed to delete intervention item",
          "DELETE_INTERVENTION_LIST_ERROR",
          { originalError: error },
        );
      }
    },

    addInterventionForStudent: async (parent, args, context) => {
      console.log("Starting addInterventionForStudent resolver");
      console.log("Received arguments:", args);

      if (!context.user || !context.user.isAdmin) {
        throw new AuthenticationError(
          "You must be logged in as an administrator!",
        );
      }

      const { interventionId, studentId } = args;

      if (!studentId) {
        throw new UserInputError("Student ID is required");
      }

      try {
        console.log("Finding accommodation card with ID:", interventionId);

        const objectIdinterventionId = mongoose.Types.ObjectId(interventionId);

        const interventionItem = await AccommodationCards.findById(
          objectIdinterventionId,
        );

        if (!interventionItem) {
          throw new Error("Accommodation card not found");
        }

        console.log("Found accommodation card:", interventionItem);

        interventionItem.createdBy = context.user._id;

        await interventionItem.save();

        console.log("Finding user with ID:", studentId);
        const user = await User.findById(studentId);

        if (!user) {
          throw new Error("User not found");
        }

        console.log("Found user:", user);

        console.log("Adding intervention item to user's interventions array");
        user.interventions.push(objectIdinterventionId);

        console.log("Saving updated user");
        await user.save();

        console.log("User successfully updated:", user);

        return user;
      } catch (error) {
        console.error("Error occurred:", error);
        throw new ApolloError(
          "Failed to add intervention for student",
          "ADD_INTERVENTION_ERROR",
          { originalError: error },
        );
      }
    },

    removeInterventionForStudent: async (parent, args, context) => {
      if (!context.user || !context.user.isAdmin) {
        throw new AuthenticationError("You need to be logged in as an admin!");
      }

      const { interventionId, studentId } = args;

      if (!studentId) {
        throw new UserInputError("Student ID is required");
      }

      try {
        const user = await User.findById(studentId);

        if (!user) {
          throw new UserInputError("Student not found");
        }

        const index = user.interventions.indexOf(interventionId);
        if (index === -1) {
          throw new UserInputError(
            "Intervention item not found for this student!",
          );
        }

        user.interventions.splice(index, 1);
        await user.save();

        return user;
      } catch (error) {
        throw new ApolloError(
          "Failed to remove intervention from student",
          "REMOVE_INTERVENTION_ERROR",
          { originalError: error },
        );
      }
    },
  },

  AccommodationCards: {
    createdBy: async (parent, args, context) => {
      console.log("Fetching createdBy user with ID:", parent.createdBy);
      try {
        const user = await User.findById(parent.createdBy);
        return user ? [user] : [];
      } catch (error) {
        console.error("Error fetching createdBy user:", error);
        return null;
      }
    },
  },
  User: {
    accommodations: async (parent, args, context) => {
      const accommodations = await AccommodationCards.find({
        _id: { $in: parent.accommodations },
      });
      return accommodations ? accommodations : [];
    },
    behaviorFrequencies: async (parent, args, context) => {
      const behaviorFrequencies = await Frequency.find({
        _id: { $in: parent.behaviorFrequencies },
      });
      return behaviorFrequencies ? behaviorFrequencies : [];
    },
    behaviorDurations: async (parent, args, context) => {
      const userBehaviorDurations = await Duration.find({
        _id: { $in: parent.behaviorDurations },
      });
      return userBehaviorDurations ? userBehaviorDurations : [];
    },
    interventions: async (parent, args, context) => {
      const userInterventions = await InterventionList.find({
        _id: { $in: parent.interventions },
      });
      return userInterventions ? userInterventions : [];
    },
  },

  Duration: {
    createdBy: async (parent, args, context) => {
      const user = await User.findById(parent.createdBy);
      return user ? [user] : [];
    },
    createdFor: async (parent, args, context) => {
      const user = await User.findById(parent.createdFor);
      return user ? [user] : [];
    },
  },
  Frequency: {
    createdBy: async (parent, args, context) => {
      const user = await User.findById(parent.createdBy);
      return user ? [user] : [];
    },
    createdFor: async (parent, args, context) => {
      const user = await User.findById(parent.createdFor);
      return user ? [user] : [];
    },
  },
  InterventionList: {
    createdBy: async (parent, args, context) => {
      const user = await User.findById(parent.createdBy);
      return user ? user : null;
    },
  },
};

module.exports = resolvers;
