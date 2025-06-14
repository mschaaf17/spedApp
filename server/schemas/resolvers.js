const {
  AuthenticationError,
  UserInputError,
  ApolloError,
} = require("apollo-server-express");
const {
  User,
  AccommodationList,
  InterventionList,
  Frequency,
  Duration,
} = require("../models");
const { signToken } = require("../utils/auth");
const moment = require("moment");
const { startOfDay, endOfDay, isEqual } = require("date-fns");
const mongoose = require("mongoose");

    
const addFrequencyToTrackForStudent = async (_, { behaviorTitle, operationalDefinition, studentId }, context) => {
  if (!context.user || !context.user.isAdmin) {
    throw new AuthenticationError("You must be logged in as an administrator!");
  }

  // Prevent duplicate behaviorTitle for the same student
  const existing = await Frequency.findOne({
    studentId,
    behaviorTitle,
    isTemplate: false,
  });
  if (existing) {
    throw new UserInputError(`Student is already tracking the behavior '${behaviorTitle}'.`);
  }

  // 1. Create the Frequency document for the student
  const frequency = await Frequency.create({
    studentId,
    behaviorTitle,
    operationalDefinition,
    createdBy: context.user._id,
    createdAt: new Date(),
    updatedAt: new Date(),
    count: 0,
    dailyCounts: [],
    log: [],
    isTemplate: false, // <-- This marks it as a student-assigned frequency
  });

  // 2. Add the Frequency's _id to the student's behaviorFrequencies array
  await User.findByIdAndUpdate(
    studentId,
    { $addToSet: { behaviorFrequencies: frequency._id } }
  );

  return frequency;
};


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

    accommodationList: async () => {
      return AccommodationList.find();
    },

    //need data to check these
    frequency: async (_, { studentId, isTemplate }, context) => {
      const filter = {};
      if (isTemplate !== undefined) filter.isTemplate = isTemplate;
      if (studentId) filter.studentId = studentId;
      console.log('FREQUENCY FILTER:', filter);
      const results = await Frequency.find(filter);
      console.log('Direct Mongoose Query Results:', results);
      if (!context.user || !context.user.isAdmin) {
        throw new AuthenticationError("You must be logged in as an administrator!");
      }
      return results;
    },

    //need data to check these
    duration: async () => {
      return Duration.find();
    },

    interventionList: async (parent, args) => {
      const filter = {};
      if (args.isTemplate !== undefined) filter.isTemplate = args.isTemplate;
      if (args.isActive !== undefined) filter.isActive = args.isActive;
      // Add more filters as needed (e.g., studentId)
      const interventionList = await InterventionList.find(filter);
      return interventionList.filter((item) => item.createdBy !== null);
    },

    interventionListForStudent: async (parent, args) => {
      const filter = {};
      if (args.studentId) filter.studentId = args.studentId;
      if (args.isTemplate !== undefined) filter.isTemplate = args.isTemplate;
      if (args.isActive !== undefined) filter.isActive = args.isActive;
      const interventionList = await InterventionList.find(filter);
      return interventionList.filter((item) => item.createdBy !== null);
    },

    interventionListForStudentByBehavior: async (parent, args) => {
      const filter = {};
      if (args.studentId) filter.studentId = args.studentId;
      if (args.behaviorId) filter.behaviorId = args.behaviorId;
      if (args.isTemplate !== undefined) filter.isTemplate = args.isTemplate;
      if (args.isActive !== undefined) filter.isActive = args.isActive;
      const interventionList = await InterventionList.find(filter);
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

    addAccommodationTemplate: async (parent, args, context) => {
      if (!context.user || !context.user.isAdmin) {
        throw new AuthenticationError(
          "You must be logged in as an admin to perform this action.",
        );
      }

      args.createdBy = context.user._id;
      args.isTemplate = true;
      const accommodationList = await AccommodationList.create(args);

      return accommodationList;
    },

    removeAccommodation: async (parent, args, context) => {
      if (!context.user || !context.user.isAdmin) {
        throw new AuthenticationError("You need to be logged in as an admin!");
      }

      try {
        const accommodationList= await AccommodationList.findByIdAndDelete(
          args._id,
        );

        if (!accommodationList) {
          throw new Error("Accommodation card not found");
        }

        console.log(accommodationList);

        return accommodationList;
      } catch (error) {
        throw new ApolloError(
          "Failed to delete accommodation card",
          "DELETE_ACCOMMODATION_CARD_ERROR",
          { originalError: error },
        );
      }
    },
    addFrequencyTitleToList: async (_, { behaviorTitle, operationalDefinition }, context) => {
      if (!context.user || !context.user.isAdmin) {
        throw new AuthenticationError("You must be logged in as an administrator!");
      }
      const frequency = await Frequency.create({
        behaviorTitle,
        operationalDefinition,
        isTemplate: true,
        createdBy: context.user._id,
        createdAt: new Date(),
        updatedAt: new Date(),
        count: 0,
        dailyCounts: [],
        log: [],
      });
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

      const { accommodationId, studentId } = args;

      if (!studentId) {
        throw new UserInputError("Student ID is required");
      }

      try {
        console.log("Finding accommodation card with ID:", accommodationId);

        const objectIdAccommodationId =
          mongoose.Types.ObjectId(accommodationId);

        const template = await AccommodationList.findById(
          objectIdAccommodationId,
        );

        if (!template) {
          throw new Error("Accommodation card not found");
        }

        console.log("Found accommodation card:", template);

        const studentAccommodation = await AccommodationList.create({
          title: template.title,
          description: template.description,
          image: template.image,
          createdBy: context.user._id,
          studentId: studentId,
          isTemplate: false,
          isActive: true,
          // createdAt will be set automatically
        });

        console.log("Finding user with ID:", studentId);
        const user = await User.findById(studentId);

        if (!user) {
          throw new Error("User not found");
        }

        console.log("Found user:", user);

        console.log("Adding accommodation card to user's accommodations array");
        user.accommodations.push(studentAccommodation._id);

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

      const { accommodationId, studentId } = args;

      if (!studentId) {
        throw new UserInputError("Student ID is required");
      }

      try {
        const user = await User.findById(studentId);

        if (!user) {
          throw new UserInputError("Student not found");
        }

        const index = user.accommodations.indexOf(accommodationId);
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
        // 1. Remove the frequency reference from the student's array
        const user = await User.findById(studentId);

        if (!user) {
          throw new UserInputError("Student not found");
        }

        const index = user.behaviorFrequencies.indexOf(frequencyId);
        if (index === -1) {
          throw new UserInputError(
            "Frequency not found for this student!"
          );
        }

        user.behaviorFrequencies.splice(index, 1);
        await user.save();

        // 2. SOFT DELETE: Set isActive to false (do NOT delete the document)
        await Frequency.findByIdAndUpdate(frequencyId, { isActive: false });

        return user;
      } catch (error) {
        throw new ApolloError(
          "Failed to remove frequency from student",
          "REMOVE_FREQUENCY_ERROR",
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
        }

        // If not a frequency, try finding a duration
        if (!frequency) {
          try {
            duration = await Duration.findById(dataMeasureId);
            console.log('Duration found:', duration);
          } catch (durationError) {
            console.error('Error finding duration:', durationError);
            throw new Error("Data measure not found or does not exist");
          }
        }
        
    
        // Proceed based on whether frequency or duration was found
        if (frequency) {
          console.log('Adding frequency to track for student:', frequency);
          
          // 1. Check for active frequency
          const activeFrequency = await Frequency.findOne({
            studentId,
            behaviorTitle: frequency.behaviorTitle,
            isTemplate: false,
            isActive: true
          });
          if (activeFrequency) {
            throw new UserInputError(`Student is already tracking the behavior '${frequency.behaviorTitle}'`);
          }

          // 2. Check for inactive frequency and restore it
          const inactiveFrequency = await Frequency.findOne({
            studentId,
            behaviorTitle: frequency.behaviorTitle,
            isTemplate: false,
            isActive: false
          });
          if (inactiveFrequency) {
            inactiveFrequency.isActive = true;
            await inactiveFrequency.save();
            // Add to student's behaviorFrequencies if not present
            await User.findByIdAndUpdate(
              studentId,
              { $addToSet: { behaviorFrequencies: inactiveFrequency._id } }
            );
            // Return updated user (populate as needed)
            const user = await User.findById(studentId).populate('behaviorFrequencies');
            return user;
          }

          // 3. Otherwise, create new as usual
          // Create new frequency for student based on template
          const newFrequency = await Frequency.create({
            studentId,
            behaviorTitle: frequency.behaviorTitle,
            operationalDefinition: frequency.operationalDefinition,
            createdBy: context.user._id,
            createdAt: new Date(),
            updatedAt: new Date(),
            count: 0,
            dailyCounts: [],
            log: [],
            isTemplate: false
          });

          // Add to student's behaviorFrequencies
          const user = await User.findByIdAndUpdate(
            studentId,
            { $addToSet: { behaviorFrequencies: newFrequency._id } },
            { new: true }
          ).populate({
            path: 'behaviorFrequencies',
            populate: {
              path: 'createdBy',
              select: '_id firstName lastName username'
            }
          }).populate({
            path: 'behaviorDurations',
            populate: {
              path: 'createdBy',
              select: '_id firstName lastName username'
            }
          });

          return user;
        } else if (duration) {
          console.log('Adding duration to track for student:', duration);
          return await addDurationToTrackForStudent(_, { durationId: dataMeasureId, studentId }, context);
        }
      } catch (error) {
        console.error('Error in addDataMeasureToStudent resolver:', error);
        throw error;
      }
    },
  incrementFrequency: async (_, { frequencyId, studentId, date }, { user }) => {
    if (!user) {
      throw new AuthenticationError('You must be logged in!');
    }

    const frequency = await Frequency.findOne({
      _id: mongoose.Types.ObjectId(frequencyId),
      studentId: mongoose.Types.ObjectId(studentId)
    });

    if (!frequency) {
      throw new UserInputError('Frequency not found for the specified behavior and student');
    }

    // Ensure count is valid and increment it
    frequency.count = (frequency.count || 0) + 1;

    // Use the passed date if valid, otherwise use the current date
    let dateToUse = date ? new Date(date) : new Date();
    if (isNaN(dateToUse.getTime())) {
      dateToUse = new Date();
    }

    frequency.updatedAt = dateToUse;
    frequency.dailyCounts.push({ date: dateToUse, count: 1 });

    await frequency.save();

    return frequency;
  },

    // frequencyIncreased: async (parent, args, context) => {
    //   if (!context.user) {
    //     throw new AuthenticationError("You must be logged in!");
    //   }
    
    //   const { frequencyId, studentId } = args;
    
    //   if (!frequencyId || !studentId) {
    //     throw new UserInputError("Frequency ID and Student ID are required");
    //   }
    
    //   try {
    //     // Find the frequency document associated with the given frequencyId and studentId
    //     const frequency = await Frequency.findOne({ _id: frequencyId, createdFor: studentId });
    
    //     if (!frequency) {
    //       throw new UserInputError("Frequency not found for the specified student");
    //     }
    
    //     // Ensure that count is a valid numeric value before incrementing
    //     if (typeof frequency.count !== 'number' || isNaN(frequency.count)) {
    //       // Initialize count with a valid numeric value (e.g., 0)
    //       frequency.count = 0;
    //     }
    
    //     // Increment the count for the specific frequency document
    //     frequency.count++;
    //     frequency.updatedAt = new Date();
    //     frequency.log.push({ time: new Date() });
    //     await frequency.save();
    
    //     // Update the user's behaviorFrequencies array
    //     const user = await User.findById(studentId);
    //     if (!user) {
    //       throw new UserInputError("Student not found");
    //     }
    
    //     const updatedBehaviorFrequencies = user.behaviorFrequencies.map(behavior => {
    //       if (behavior._id.toString() === frequencyId) {
    //         // Increment the count for the corresponding behavior frequency
    //         behavior.count++;
    //       }
    //       return behavior;
    //     });
    
    //     user.behaviorFrequencies = updatedBehaviorFrequencies;
    //     await user.save();
    
    //     return frequency;
    //   } catch (error) {
    //     throw new ApolloError(
    //       "Failed to increase frequency count",
    //       "FREQUENCY_INCREASE_ERROR",
    //       { originalError: error },
    //     );
    //   }
    // },
    
    

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

    addInterventionTemplate: async (parent, args, context) => {
      if (!context.user || !context.user.isAdmin) {
        throw new AuthenticationError("You must be logged in as an admin");
      }
      args.createdBy = context.user._id;
      args.isTemplate = true;
      const interventionItem = await InterventionList.create(args);
      return interventionItem;
    },

    removedInterventionFromList: async (parent, args, context) => {
      if (!context.user || !context.user.isAdmin) {
        throw new AuthenticationError("You need to be logged in as an admin");
      }
      try {
        const interventionItem = await InterventionList.findByIdAndUpdate(
          args._id,
          { isActive: false },
          { new: true }
        );
        if (!interventionItem) {
          throw new Error("Intervention was not found");
        }
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
      if (!context.user || !context.user.isAdmin) {
        throw new AuthenticationError("You must be logged in as an administrator!");
      }

      const { interventionId, studentId, behaviorId } = args;

      if (!studentId) {
        throw new UserInputError("Student ID is required");
      }

      try {
        console.log('Finding intervention template:', interventionId);
        const interventionTemplate = await InterventionList.findById(interventionId);
        console.log('Found template:', interventionTemplate);

        if (!interventionTemplate || !interventionTemplate.isTemplate) {
          throw new Error("Intervention template not found");
        }

        console.log('Checking for existing assignment...');
        const existing = await InterventionList.findOne({
          studentId,
          title: interventionTemplate.title,
          behaviorId,
          isTemplate: false,
          isActive: true,
        });
        console.log('Existing assignment:', existing);

        if (existing) {
          // Optionally, restore if it was soft-deleted
          if (!existing.isActive) {
            existing.isActive = true;
            await existing.save();
            return existing;
          }
          throw new UserInputError("Student already has this intervention assigned.");
        }

        console.log('Creating new intervention for student...');
        const behavior = await Frequency.findById(behaviorId);
        const newIntervention = await InterventionList.create({
          title: interventionTemplate.title,
          summary: interventionTemplate.summary,
          function: interventionTemplate.function,
          createdBy: context.user._id,
          studentId,
          behaviorId,
          behaviorTitle: behavior ? behavior.behaviorTitle : undefined,
          isTemplate: false,
          isActive: true,
        });

        // Add the new intervention to the user's interventions array
        await User.findByIdAndUpdate(
          studentId,
          { $addToSet: { interventions: newIntervention._id } }
        );

        return newIntervention;
      } catch (error) {
        console.error('Error in addInterventionForStudent:', error);
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
        // 1. Remove the reference from the user's interventions array (optional)
        const user = await User.findById(studentId);
        if (!user) {
          throw new UserInputError("Student not found");
        }
        const index = user.interventions.indexOf(interventionId);
        if (index !== -1) {
          user.interventions.splice(index, 1);
          await user.save();
        }

        // 2. SOFT DELETE: Set isActive to false
        await InterventionList.findByIdAndUpdate(interventionId, { isActive: false });

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

  AccommodationList: {
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
      const accommodations = await AccommodationList.find({
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
      if (!parent.createdBy || !parent.createdBy.length) return [];
      const users = await User.find({ _id: { $in: parent.createdBy } });
      return users;
    },
    createdFor: async (parent, args, context) => {
      if (!parent.createdFor || !parent.createdFor.length) return [];
      const users = await User.find({ _id: { $in: parent.createdFor } });
      return users;
    },
  },
  InterventionList: {
    createdBy: async (parent, args, context) => {
      const user = await User.findById(parent.createdBy);
      return user ? user : null;
    },
    studentId: async (parent) => {
      if (!parent.studentId) return null;
      return await User.findById(parent.studentId);
    },
    behaviorId: async (parent) => {
      if (!parent.behaviorId) return null;
      return await Frequency.findById(parent.behaviorId);
    },
  },
};

module.exports = resolvers;
