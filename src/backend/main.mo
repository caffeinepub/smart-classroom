import Map "mo:core/Map";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import List "mo:core/List";
import Int "mo:core/Int";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  type Answer = {
    questionIndex : Nat;
    selectedOption : Nat;
  };

  type Notification = {
    userId : Principal;
    message : Text;
    notificationType : Text;
    isRead : Bool;
  };

  type AttendanceRecord = {
    date : Time.Time;
    isPresent : Bool;
  };

  module UserProfile {
    public type Role = {
      #student;
      #teacher;
    };

    public type Profile = {
      username : Text;
      role : Role;
    };
  };

  module Quiz {
    public type Question = {
      text : Text;
      options : [Text];
      correctIndex : Nat;
    };

    public type Quiz = {
      title : Text;
      questions : [Question];
    };

    public type Score = {
      userId : Principal;
      quizId : Nat;
      score : Int;
    };
  };

  module Poll {
    public type Poll = {
      question : Text;
      options : [Text];
      voteCounts : [Nat];
    };
  };

  module Doubt {
    public type Doubt = {
      studentId : Principal;
      text : Text;
      reply : ?Text;
      isResolved : Bool;
    };
  };

  module Feedback {
    public type Feedback = {
      studentId : Principal;
      text : Text;
      rating : Nat;
    };
  };

  // Authorization state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User management
  let userProfiles = Map.empty<Principal, UserProfile.Profile>();
  let userGameScores = Map.empty<Principal, Float>();

  // Quiz management
  let quizzes = Map.empty<Nat, Quiz.Quiz>();
  let quizScores = Map.empty<Nat, List.List<Quiz.Score>>();

  // Poll management
  let polls = Map.empty<Nat, Poll.Poll>();
  let pollVotes = Map.empty<Nat, Map.Map<Principal, Bool>>();

  // Doubt management
  let doubts = Map.empty<Nat, Doubt.Doubt>();

  // Feedback management
  let feedbacks = Map.empty<Nat, Feedback.Feedback>();

  // Notification management
  let notifications = Map.empty<Principal, List.List<Notification>>();

  // Attendance management
  let attendanceRecords = Map.empty<Principal, List.List<AttendanceRecord>>();

  // Helper function to check if user is a teacher
  private func isTeacher(userId : Principal) : Bool {
    switch (userProfiles.get(userId)) {
      case (null) { false };
      case (?profile) {
        switch (profile.role) {
          case (#teacher) { true };
          case (#student) { false };
        };
      };
    };
  };

  // Helper function to check if user is a student
  private func isStudent(userId : Principal) : Bool {
    switch (userProfiles.get(userId)) {
      case (null) { false };
      case (?profile) {
        switch (profile.role) {
          case (#student) { true };
          case (#teacher) { false };
        };
      };
    };
  };

  // User registration
  public shared ({ caller }) func registerUser(username : Text, role : UserProfile.Role) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can register");
    };
    
    let profile = { username; role };
    userProfiles.add(caller, profile);
    userGameScores.add(caller, 0.0);
    
    // Assign AccessControl role based on app role
    switch (role) {
      case (#teacher) {
        AccessControl.assignRole(accessControlState, caller, caller, #admin);
      };
      case (#student) {
        AccessControl.assignRole(accessControlState, caller, caller, #user);
      };
    };
  };

  // Required profile management functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile.Profile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile.Profile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getUserProfile(userId : Principal) : async ?UserProfile.Profile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    if (caller != userId and not isTeacher(caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile unless you are a teacher");
    };
    userProfiles.get(userId);
  };

  // Get all students (teacher only)
  public query ({ caller }) func getStudents() : async [UserProfile.Profile] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view students");
    };
    if (not isTeacher(caller)) {
      Runtime.trap("Unauthorized: Only teachers can view all students");
    };
    
    userProfiles.values().toArray().filter(
      func(p) {
        switch (p.role) {
          case (#student) { true };
          case (#teacher) { false };
        };
      }
    );
  };

  public query ({ caller }) func getLeaderboard() : async [UserProfile.Profile] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view leaderboard");
    };
    
    userProfiles.values().toArray().filter(
      func(p) {
        switch (p.role) {
          case (#student) { true };
          case (#teacher) { false };
        };
      }
    );
  };

  // Create quiz (teacher only)
  public shared ({ caller }) func createQuiz(title : Text, questions : [Quiz.Question]) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can create quizzes");
    };
    if (not isTeacher(caller)) {
      Runtime.trap("Unauthorized: Only teachers can create quizzes");
    };
    
    let id = quizzes.size() + 1;
    let quiz = { title; questions };
    quizzes.add(id, quiz);
    id;
  };

  // Get all quizzes (authenticated users)
  public query ({ caller }) func getQuizzes() : async [Quiz.Quiz] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view quizzes");
    };
    quizzes.values().toArray();
  };

  // Submit quiz answers (student only)
  public shared ({ caller }) func submitQuizAnswers(quizId : Nat, answers : [Answer]) : async Int {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can submit quiz answers");
    };
    if (not isStudent(caller)) {
      Runtime.trap("Unauthorized: Only students can submit quiz answers");
    };
    
    switch (quizzes.get(quizId)) {
      case (null) { -1 };
      case (?quiz) {
        var score = 0;
        for (answer in answers.values()) {
          if (answer.questionIndex < quiz.questions.size() and 
              quiz.questions[answer.questionIndex].correctIndex == answer.selectedOption) {
            score += 1;
          };
        };
        let userScore = {
          userId = caller;
          quizId;
          score;
        };
        switch (quizScores.get(quizId)) {
          case (null) {
            let newScores = List.empty<Quiz.Score>();
            newScores.add(userScore);
            quizScores.add(quizId, newScores);
          };
          case (?scores) {
            scores.add(userScore);
          };
        };
        score;
      };
    };
  };

  // Create poll (teacher only)
  public shared ({ caller }) func createPoll(question : Text, options : [Text]) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can create polls");
    };
    if (not isTeacher(caller)) {
      Runtime.trap("Unauthorized: Only teachers can create polls");
    };
    
    let id = polls.size() + 1;
    let poll = {
      question;
      options;
      voteCounts = Array.tabulate(options.size(), func(_) { 0 });
    };
    polls.add(id, poll);
    pollVotes.add(id, Map.empty<Principal, Bool>());
    id;
  };

  // Vote on poll (student only, once per poll)
  public shared ({ caller }) func votePoll(pollId : Nat, optionIndex : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can vote on polls");
    };
    if (not isStudent(caller)) {
      Runtime.trap("Unauthorized: Only students can vote on polls");
    };
    
    // Check if already voted
    switch (pollVotes.get(pollId)) {
      case (null) { Runtime.trap("Poll not found") };
      case (?voters) {
        switch (voters.get(caller)) {
          case (?_) { Runtime.trap("You have already voted on this poll") };
          case (null) {
            // Record the vote
            voters.add(caller, true);
            
            // Update vote counts
            switch (polls.get(pollId)) {
              case (null) { Runtime.trap("Poll not found") };
              case (?poll) {
                if (optionIndex >= poll.voteCounts.size()) {
                  Runtime.trap("Invalid option index");
                };
                let updatedVotes = Array.tabulate(
                  poll.voteCounts.size(),
                  func(i) {
                    if (i == optionIndex) { poll.voteCounts[i] + 1 } else { poll.voteCounts[i] };
                  },
                );
                let updatedPoll = {
                  question = poll.question;
                  options = poll.options;
                  voteCounts = updatedVotes;
                };
                polls.add(pollId, updatedPoll);
              };
            };
          };
        };
      };
    };
  };

  // Get all polls (authenticated users)
  public query ({ caller }) func getPolls() : async [Poll.Poll] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view polls");
    };
    polls.values().toArray();
  };

  // Submit doubt (student only)
  public shared ({ caller }) func submitDoubt(text : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can submit doubts");
    };
    if (not isStudent(caller)) {
      Runtime.trap("Unauthorized: Only students can submit doubts");
    };
    
    let id = doubts.size() + 1;
    let doubt = {
      studentId = caller;
      text;
      reply = null;
      isResolved = false;
    };
    doubts.add(id, doubt);
    id;
  };

  // Reply to doubt (teacher only)
  public shared ({ caller }) func replyDoubt(doubtId : Nat, reply : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can reply to doubts");
    };
    if (not isTeacher(caller)) {
      Runtime.trap("Unauthorized: Only teachers can reply to doubts");
    };
    
    switch (doubts.get(doubtId)) {
      case (null) { Runtime.trap("Doubt not found") };
      case (?doubt) {
        let updatedDoubt = {
          studentId = doubt.studentId;
          text = doubt.text;
          reply = ?reply;
          isResolved = false;
        };
        doubts.add(doubtId, updatedDoubt);
      };
    };
  };

  // Get all doubts (teacher only)
  public query ({ caller }) func getAllDoubts() : async [Doubt.Doubt] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view doubts");
    };
    if (not isTeacher(caller)) {
      Runtime.trap("Unauthorized: Only teachers can view all doubts");
    };
    doubts.values().toArray();
  };

  // Get my doubts (student only - their own doubts)
  public query ({ caller }) func getMyDoubts() : async [Doubt.Doubt] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view doubts");
    };
    if (not isStudent(caller)) {
      Runtime.trap("Unauthorized: Only students can view their doubts");
    };
    
    doubts.values().toArray().filter(
      func(d) { d.studentId == caller }
    );
  };

  // Mark doubt resolved (teacher only)
  public shared ({ caller }) func markDoubtResolved(doubtId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can mark doubts resolved");
    };
    if (not isTeacher(caller)) {
      Runtime.trap("Unauthorized: Only teachers can mark doubts as resolved");
    };
    
    switch (doubts.get(doubtId)) {
      case (null) { Runtime.trap("Doubt not found") };
      case (?doubt) {
        let updatedDoubt = {
          studentId = doubt.studentId;
          text = doubt.text;
          reply = doubt.reply;
          isResolved = true;
        };
        doubts.add(doubtId, updatedDoubt);
      };
    };
  };

  // Submit feedback (student only)
  public shared ({ caller }) func submitFeedback(text : Text, rating : Nat) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can submit feedback");
    };
    if (not isStudent(caller)) {
      Runtime.trap("Unauthorized: Only students can submit feedback");
    };
    if (rating < 1 or rating > 5) {
      Runtime.trap("Rating must be between 1 and 5");
    };
    
    let id = feedbacks.size() + 1;
    let feedback = {
      studentId = caller;
      text;
      rating;
    };
    feedbacks.add(id, feedback);
    id;
  };

  // Get all feedback (teacher only)
  public query ({ caller }) func getAllFeedback() : async [Feedback.Feedback] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view feedback");
    };
    if (not isTeacher(caller)) {
      Runtime.trap("Unauthorized: Only teachers can view all feedback");
    };
    feedbacks.values().toArray();
  };

  // Submit game score (student only)
  public shared ({ caller }) func submitGameScore(points : Float) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can submit game scores");
    };
    if (not isStudent(caller)) {
      Runtime.trap("Unauthorized: Only students can submit game scores");
    };
    
    let currentScore = switch (userGameScores.get(caller)) {
      case (null) { 0.0 };
      case (?score) { score };
    };
    if (points > currentScore) {
      userGameScores.add(caller, points);
    };
  };

  // Get leaderboard (authenticated users)
  public query ({ caller }) func getGameLeaderboard() : async [(Principal, Float)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view leaderboard");
    };
    
    userGameScores.toArray().map(
      func((id, score)) { (id, score) }
    );
  };

  // Add notification (teacher only)
  public shared ({ caller }) func addNotification(userId : Principal, message : Text, notificationType : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can add notifications");
    };
    if (not isTeacher(caller)) {
      Runtime.trap("Unauthorized: Only teachers can add notifications");
    };
    
    let notification = {
      userId;
      message;
      notificationType;
      isRead = false;
    };
    switch (notifications.get(userId)) {
      case (null) {
        let newList = List.empty<Notification>();
        newList.add(notification);
        notifications.add(userId, newList);
      };
      case (?notifs) {
        notifs.add(notification);
      };
    };
  };

  // Get notifications (own notifications only)
  public query ({ caller }) func getNotifications() : async [Notification] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view notifications");
    };
    
    switch (notifications.get(caller)) {
      case (null) { [] };
      case (?notifs) { notifs.toArray() };
    };
  };

  // Mark all notifications as read (own notifications only)
  public shared ({ caller }) func markNotificationsAsRead() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can mark notifications as read");
    };
    
    switch (notifications.get(caller)) {
      case (null) { () };
      case (?notifs) {
        let updatedList = List.empty<Notification>();
        for (n in notifs.values()) {
          let updatedNotif = {
            userId = caller;
            message = n.message;
            notificationType = n.notificationType;
            isRead = true;
          };
          updatedList.add(updatedNotif);
        };
        notifications.add(caller, updatedList);
      };
    };
  };

  // Mark attendance (teacher only)
  public shared ({ caller }) func markAttendance(studentId : Principal, isPresent : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can mark attendance");
    };
    if (not isTeacher(caller)) {
      Runtime.trap("Unauthorized: Only teachers can mark attendance");
    };
    if (not isStudent(studentId)) {
      Runtime.trap("Can only mark attendance for students");
    };
    
    let record = {
      date = Time.now();
      isPresent;
    };
    switch (attendanceRecords.get(studentId)) {
      case (null) {
        let newList = List.empty<AttendanceRecord>();
        newList.add(record);
        attendanceRecords.add(studentId, newList);
      };
      case (?records) {
        records.add(record);
      };
    };
  };

  // Get attendance history (own attendance for students, any for teachers)
  public query ({ caller }) func getAttendanceHistory(studentId : ?Principal) : async [AttendanceRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view attendance");
    };
    
    let targetId = switch (studentId) {
      case (null) { caller };
      case (?id) {
        if (caller != id and not isTeacher(caller)) {
          Runtime.trap("Unauthorized: Can only view your own attendance unless you are a teacher");
        };
        id;
      };
    };
    
    switch (attendanceRecords.get(targetId)) {
      case (null) { [] };
      case (?records) { records.toArray() };
    };
  };

  // Get class attendance (teacher only)
  public query ({ caller }) func getClassAttendance() : async [(Principal, [AttendanceRecord])] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view class attendance");
    };
    if (not isTeacher(caller)) {
      Runtime.trap("Unauthorized: Only teachers can view class attendance");
    };
    
    attendanceRecords.toArray().map(
      func((id, records)) { (id, records.toArray()) }
    );
  };
};
