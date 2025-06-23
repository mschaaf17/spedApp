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

    
const addFrequencyToTrackForStudent = async (_, { behaviorTitle, operationalDefinition, studentId, templateId }, context) => {
  if (!context.user || !context.user.isAdmin) {
    throw new AuthenticationError("You must be logged in as an administrator!");
  }

  // Prevent duplicate templateId for the same student
  const existing = await Frequency.findOne({
    studentId,
    templateId,
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
    templateId,
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
    const template = await Duration.findById(durationId);
    if (!template) throw new UserInputError('Duration template not found');

    // Check for existing active duration with same template
    const existingActive = await Duration.findOne({
      createdFor: studentId,
      templateId: template._id,
      isTemplate: false,
      isActive: true
    });
    
    if (existingActive) {
      throw new UserInputError(`Student is already tracking the behavior '${template.behaviorTitle}'`);
    }

    // Check for inactive duration and restore it
    const existingInactive = await Duration.findOne({
      createdFor: studentId,
      templateId: template._id,
      isTemplate: false,
      isActive: false
    });
    
    if (existingInactive) {
      existingInactive.isActive = true;
      // Don't reset data - preserve existing timers and history
      await existingInactive.save();
      
      // Add to student's behaviorDurations if not present
      await User.findByIdAndUpdate(
        studentId,
        { $addToSet: { behaviorDurations: existingInactive._id } }
      );
      
      // Return updated user with populated data
      const user = await User.findById(studentId)
        .populate('behaviorFrequencies')
        .populate('behaviorDurations');
      return user;
    }

    // Create new duration if none exists
    console.log('Creating new duration with template data:', {
      behaviorTitle: template.behaviorTitle,
      operationalDefinition: template.operationalDefinition,
      templateId: template._id
    });
    
    const newDuration = await Duration.create({
      behaviorTitle: template.behaviorTitle,
      operationalDefinition: template.operationalDefinition,
      createdBy: context.user._id,
      createdFor: studentId,
      isTemplate: false,
      templateId: template._id,
      isActive: true,
      timers: [],
      createdAt: new Date()
    });

    console.log('Created new duration:', {
      _id: newDuration._id,
      behaviorTitle: newDuration.behaviorTitle,
      operationalDefinition: newDuration.operationalDefinition
    });

    // Add to student's behaviorDurations
    const user = await User.findByIdAndUpdate(
      studentId,
      { $addToSet: { behaviorDurations: newDuration._id } },
      { new: true }
    ).populate('behaviorFrequencies')
     .populate('behaviorDurations');

    if (!user) {
      throw new UserInputError("Student not found");
    }

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
        console.log('Context user found:', context.user);
        try {
          const userData = await User.findOne({ _id: context.user._id })
            .select("-__v -password")
            .populate("students")
            .populate("accommodations")
            .populate("behaviorFrequencies")
            .populate("behaviorDurations")
            .populate("interventions");

          if (!userData) {
            console.error('No user found in DB for _id from context:', context.user._id);
            // This can happen if the user was deleted but the token is still valid.
            throw new AuthenticationError("User associated with this token no longer exists.");
          }
          
          console.log('User data from DB:', userData);
          return userData;

        } catch (err) {
          console.error('Error fetching user data in ME resolver:', err);
          throw new ApolloError("Error fetching user data.");
        }
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
          user = await User.findOne({ username: identifier });
        } else {
          user = await User.findById(identifier);
        }
        
        console.log('User found:', user); // Log the user object
    
        return user;
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

    accommodationList: async (parent, args) => {
      const filter = {};
      if (args && args.isTemplate !== undefined) filter.isTemplate = args.isTemplate;
      if (args && args.isActive !== undefined) filter.isActive = args.isActive;
      const accommodationList = await AccommodationList.find(filter);
      return accommodationList.filter((item) => item.createdBy !== null);
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

    duration: async (_, { studentId, isTemplate }, context) => {
      const filter = {};
      if (isTemplate !== undefined) filter.isTemplate = isTemplate;
      if (studentId) filter.createdFor = studentId;
      filter.isActive = true; // Only return active durations
      console.log('Duration FILTER:', filter);
      const results = await Duration.find(filter);
      console.log('Direct Mongoose Query Results:', results);
      if (!context.user || !context.user.isAdmin) {
        throw new AuthenticationError("You must be logged in as an administrator!");
      }
      return results;
    },

    //need data to check these
    // duration: async (parent, args) => {
    //   const filter = {};
    //   if (isTemplate !== undefined) filter.isTemplate = isTemplate;
    //   if (studentId) filter.studentId = studentId;
    //   if (args.isTemplate !== undefined) filter.isTemplate = args.isTemplate;
    //   if (args.isActive !== undefined) filter.isActive = args.isActive;
    //   return Duration.find(filter).populate('createdBy');
    // },

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

    getRunningTimers: async (parent, { studentId, behaviorTitle }, context) => {
      if (!context.user) throw new Error("User not logged in.");

      // Find all durations for this student and behavior
      const durations = await Duration.find({
        createdFor: studentId,
        behaviorTitle: behaviorTitle,
        isActive: true
      });

      // Collect all running timers
      let runningTimers = [];
      durations.forEach(duration => {
        const running = duration.timers.filter(timer => timer.status === 'running' && timer.isActive);
        runningTimers = runningTimers.concat(running);
      });

      return runningTimers;
    },

    timersForDuration: async (parent, { durationId, studentId }) => {
      return Duration.findOne({ 
        _id: durationId,
        createdFor: studentId
      });
    },
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
        args.isTemplate = true;
        args.templateId = null;

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
   
   
    addAccommodationForStudent: async (parent, { accommodationId, studentId }, context) => {
      if (context.user) {
        try {
          // Find the template accommodation
          const templateAccommodation = await AccommodationList.findById(accommodationId);
          if (!templateAccommodation) {
            throw new Error('Template accommodation not found');
          }

          // Create a new accommodation for the student
          const studentAccommodation = await AccommodationList.create({
            title: templateAccommodation.title,
            description: templateAccommodation.description,
            image: templateAccommodation.image,
            createdBy: context.user._id,
            studentId: studentId,
            isTemplate: false,
            isActive: true,
            templateId: accommodationId,
            createdAt: new Date()
          });

          // Add the accommodation to the student's accommodations array
          const updatedUser = await User.findByIdAndUpdate(
            studentId,
            { $push: { accommodations: studentAccommodation._id } },
            { new: true }
          );

          return updatedUser;
        } catch (error) {
          console.error('Error in addAccommodationForStudent:', error);
          throw new Error('Failed to add accommodation for student');
        }
      }
      throw new AuthenticationError('You need to be logged in!');
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

        // Soft delete the duration
        await Duration.findByIdAndUpdate(durationId, { isActive: false });

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
          
          // 1. Check for active frequency with same templateId
          const activeFrequency = await Frequency.findOne({
            studentId,
            templateId: frequency._id,
            isTemplate: false,
            isActive: true
          });
          console.log('Active frequency check result:', activeFrequency);
          if (activeFrequency) {
            throw new UserInputError(`Student is already tracking the behavior '${frequency.behaviorTitle}'`);
          }

          // 2. Check for inactive frequency with same templateId and restore it
          const inactiveFrequency = await Frequency.findOne({
            studentId,
            templateId: frequency._id,
            isTemplate: false,
            isActive: false
          });
          console.log('Inactive frequency check result:', inactiveFrequency);
          if (inactiveFrequency) {
            console.log('Restoring inactive frequency');
            inactiveFrequency.isActive = true;
            // Don't reset data - preserve existing counts and history
            await inactiveFrequency.save();
            // Add to student's behaviorFrequencies if not present
            await User.findByIdAndUpdate(
              studentId,
              { $addToSet: { behaviorFrequencies: inactiveFrequency._id } }
            );
            // Return updated user (populate as needed)
            const user = await User.findById(studentId)
              .populate('behaviorFrequencies')
              .populate('behaviorDurations');
            return user;
          }

          // 3. Otherwise, create new as usual
          // Create new frequency for student based on template
          console.log('Creating new frequency with template data:', {
            behaviorTitle: frequency.behaviorTitle,
            operationalDefinition: frequency.operationalDefinition,
            templateId: frequency._id
          });
          
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
            isTemplate: false,
            templateId: frequency._id,
          });

          console.log('Created new frequency:', {
            _id: newFrequency._id,
            behaviorTitle: newFrequency.behaviorTitle,
            operationalDefinition: newFrequency.operationalDefinition,
            createdAt: newFrequency.createdAt,
            isTemplate: newFrequency.isTemplate
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

          console.log('Updated user with new frequency:', {
            userId: user._id,
            behaviorFrequenciesCount: user.behaviorFrequencies.length,
            behaviorDurationsCount: user.behaviorDurations.length
          });

          return user;
        } else if (duration) {
          console.log('Adding duration to track for student:', duration);
          const result = await addDurationToTrackForStudent(_, { durationId: dataMeasureId, studentId }, context);
          
          // Ensure we return the populated user data
          const populatedUser = await User.findById(studentId)
            .populate('behaviorFrequencies')
            .populate('behaviorDurations');
          
          return populatedUser;
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
    
    // Also add to log array for consistency
    frequency.log.push({ time: dateToUse });

    await frequency.save();

    return frequency;
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

    startDurationTimer: async (parent, { durationId, studentId }, context) => {
      if (!context.user) throw new Error("User not logged in.");

      // Find the duration document for this specific student
      const duration = await Duration.findOne({ 
        _id: durationId,
        createdFor: studentId
      });
      if (!duration) throw new UserInputError("Duration not found for this student");

      // Create a new timer object
      const newTimer = {
        startTime: new Date(),
        status: 'running',
        createdBy: context.user._id,
        // timerId will be auto-generated
      };

      // Add the timer to the timers array
      duration.timers.push(newTimer);
      await duration.save();

      // Return the new timer (or the updated duration, as you prefer)
      return duration.timers[duration.timers.length - 1];
    },

    endDurationTimer: async (parent, { durationId, timerId, studentId }, context) => {
      if (!context.user) throw new Error("User not logged in.");

      const duration = await Duration.findOne({ 
        _id: durationId,
        createdFor: studentId
      });
      if (!duration) throw new UserInputError("Duration not found for this student");

      // Find the timer by timerId (ensure both are strings for comparison)
      const timer = duration.timers.find(
        t => t.timerId.toString() === timerId.toString()
      );
      if (!timer) throw new UserInputError("Timer not found");

      timer.endTime = new Date();
      timer.status = 'stopped';
      await duration.save();

      return timer;
    },

    // removeLastDurationTimer: async (parent, args, context) => {
    //   // Check if user is logged in
    //   if (!context.user) {
    //     throw new Error("User not logged in.");
    //   }

    //   try {
    //     // Find the last duration entry created by the user and who it was created for then remove it
    //     //can I just remove the duration id since that is what will be updated with all thisinfo?
    //     const lastDuration = await Duration.findByIdAndDelete(args._id);

    //     // If no duration found
    //     if (!lastDuration) {
    //       throw new Error("No duration found to remove.");
    //     }

    //     // Return the ID of the removed duration entry
    //     return {
    //       id: lastDuration._id,
    //     };
    //   } catch (error) {
    //     console.error(error);
    //     throw new Error("Failed to remove last duration timer.");
    //   }
    // },

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
        // Try to find behavior in Frequency first, then Duration
        let behavior = await Frequency.findById(behaviorId);
        if (!behavior) {
          behavior = await Duration.findById(behaviorId);
        }
        
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

    resumeDurationTimer: async (parent, { durationId, timerId, studentId }, context) => {
      if (!context.user) throw new Error("User not logged in.");

      const duration = await Duration.findOne({ 
        _id: durationId,
        createdFor: studentId
      });
      if (!duration) throw new UserInputError("Duration not found for this student");

      // Use .find() to match custom timerId
      const timer = duration.timers.find(
        t => t.timerId.toString() === timerId.toString()
      );
      if (!timer) throw new UserInputError("Timer not found");

      timer.status = 'running';
      await duration.save();

      return timer;
    },

    resetDurationTimer: async (parent, { durationId, timerId, studentId }, context) => {
      if (!context.user) throw new Error("User not logged in.");

      const duration = await Duration.findOne({ 
        _id: durationId,
        createdFor: studentId
      });
      if (!duration) throw new UserInputError("Duration not found for this student");

      // Use .find() to match custom timerId
      const timer = duration.timers.find(
        t => t.timerId.toString() === timerId.toString()
      );
      if (!timer) throw new UserInputError("Timer not found");

      timer.startTime = new Date();
      timer.endTime = null;
      timer.status = 'running';
      await duration.save();

      return timer;
    },

    saveDurationTimer: async (parent, { durationId, timerId, studentId }, context) => {
      if (!context.user) throw new Error("User not logged in.");

      const duration = await Duration.findOne({ 
        _id: durationId,
        createdFor: studentId
      });
      if (!duration) throw new UserInputError("Duration not found for this student");

      // Use .find() to match custom timerId
      const timer = duration.timers.find(
        t => t.timerId.toString() === timerId.toString()
      );
      if (!timer) throw new UserInputError("Timer not found");

      timer.status = 'saved';
      await duration.save();

      return timer;
    },

    updateStudentViewConfig: async (parent, { studentId, showAccommodations, selectedCharts }, context) => {
      if (!context.user || !context.user.isAdmin) {
        throw new AuthenticationError("You must be logged in as an administrator!");
      }

      try {
        const updatedUser = await User.findByIdAndUpdate(
          studentId,
          {
            studentViewConfig: {
              showAccommodations,
              selectedCharts
            }
          },
          { new: true }
        ).populate('behaviorFrequencies')
         .populate('behaviorDurations')
         .populate('accommodations')
         .populate('interventions');

        if (!updatedUser) {
          throw new UserInputError("Student not found");
        }

        return updatedUser;
      } catch (error) {
        throw new ApolloError(
          "Failed to update student view configuration",
          "UPDATE_STUDENT_VIEW_CONFIG_ERROR",
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
    templateId: async (parent) => {
      if (!parent.templateId) return null;
      return await AccommodationList.findById(parent.templateId);
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
        isActive: true // Only return active frequencies
      });
      
      console.log('behaviorFrequencies field resolver - raw data:', behaviorFrequencies);
      
      // Calculate count from dailyCounts for today and populate missing operational definitions
      const frequenciesWithCount = await Promise.all(behaviorFrequencies.map(async (frequency) => {
        const today = new Date();
        const todayString = today.toLocaleDateString();
        
        const todayCount = (frequency.dailyCounts || [])
          .filter(dc => {
            if (!dc.date) return false;
            let d;
            if (typeof dc.date === 'number') {
              d = new Date(dc.date);
            } else if (typeof dc.date === 'string') {
              if (/^\d+$/.test(dc.date)) {
                d = new Date(Number(dc.date));
              } else {
                d = new Date(dc.date);
              }
            }
            if (!d || isNaN(d.getTime())) return false;
            const dString = d.toLocaleDateString();
            return dString === todayString;
          })
          .reduce((sum, dc) => sum + dc.count, 0);
        
        let operationalDefinition = frequency.operationalDefinition;
        
        // If operational definition is missing and we have a templateId, get it from the template
        if (!operationalDefinition && frequency.templateId) {
          const template = await Frequency.findById(frequency.templateId);
          if (template && template.operationalDefinition) {
            operationalDefinition = template.operationalDefinition;
            // Update the frequency record with the operational definition
            await Frequency.findByIdAndUpdate(frequency._id, {
              operationalDefinition: template.operationalDefinition
            });
            console.log(`Updated frequency "${frequency.behaviorTitle}" with operational definition from template`);
          }
        }
        
        const result = {
          ...frequency.toObject(),
          count: todayCount, // Use today's count from dailyCounts
          operationalDefinition: operationalDefinition
        };
        
        console.log('Frequency with count:', {
          _id: result._id,
          behaviorTitle: result.behaviorTitle,
          operationalDefinition: result.operationalDefinition,
          count: result.count
        });
        
        return result;
      }));
      
      return frequenciesWithCount ? frequenciesWithCount : [];
    },
    behaviorDurations: async (parent, args, context) => {
      const userBehaviorDurations = await Duration.find({
        _id: { $in: parent.behaviorDurations },
        isActive: true // Only return active durations
      });
      
      console.log('behaviorDurations field resolver - raw data:', userBehaviorDurations);
      
      // Populate missing operational definitions from templates
      const durationsWithOperationalDefinition = await Promise.all(userBehaviorDurations.map(async (duration) => {
        let operationalDefinition = duration.operationalDefinition;
        
        // If operational definition is missing and we have a templateId, get it from the template
        if (!operationalDefinition && duration.templateId) {
          const template = await Duration.findById(duration.templateId);
          if (template && template.operationalDefinition) {
            operationalDefinition = template.operationalDefinition;
            // Update the duration record with the operational definition
            await Duration.findByIdAndUpdate(duration._id, {
              operationalDefinition: template.operationalDefinition
            });
            console.log(`Updated duration "${duration.behaviorTitle}" with operational definition from template`);
          }
        }
        
        const result = {
          ...duration.toObject(),
          operationalDefinition: operationalDefinition
        };
        
        console.log('Duration results:', {
          _id: result._id,
          behaviorTitle: result.behaviorTitle,
          operationalDefinition: result.operationalDefinition
        });
        
        return result;
      }));
      
      return durationsWithOperationalDefinition ? durationsWithOperationalDefinition : [];
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
      
      // Try to find in Frequency first
      let behavior = await Frequency.findById(parent.behaviorId);
      
      // If not found in Frequency, try Duration
      if (!behavior) {
        behavior = await Duration.findById(parent.behaviorId);
      }
      
      return behavior;
    },
  },
};

module.exports = resolvers;
