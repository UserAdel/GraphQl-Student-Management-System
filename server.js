const express = require("express");
const { ApolloServer, gql } = require("apollo-server-express");

let students = [
  {
    id: "1",
    name: "Ahmed Hassan",
    email: "ahmed@iti.edu",
    age: 22,
    major: "Computer Science",
  },
  {
    id: "2",
    name: "Fatma Ali",
    email: "fatma@iti.edu",
    age: 21,
    major: "Information Systems",
  },
];

let courses = [
  {
    id: "1",
    title: "Data Structures",
    code: "CS201",
    credits: 3,
    instructor: "Dr. Mohamed",
  },
  {
    id: "2",
    title: "Database Systems",
    code: "CS301",
    credits: 4,
    instructor: "Dr. Sarah",
  },
];

let enrollments = {
  1: ["1", "2"],
  2: ["2"],
};

const typeDefs = gql`
  # Student Type
  type Student {
    id: ID!
    name: String!
    email: String!
    age: Int!
    major: String
    courses: [Course!]!
  }

  # Course Type
  type Course {
    id: ID!
    title: String!
    code: String!
    credits: Int!
    instructor: String!
    students: [Student!]!
  }

  # Query Type - All read operations
  type Query {
    getAllStudents: [Student!]!
    getStudent(id: ID!): Student
    getAllCourses: [Course!]!
    getCourse(id: ID!): Course
    searchStudentsByMajor(major: String!): [Student!]!
  }

  # Mutation Type - All write operations
  type Mutation {
    # Student Operations
    addStudent(
      name: String!
      email: String!
      age: Int!
      major: String
    ): Student!
    updateStudent(
      id: ID!
      name: String
      email: String
      age: Int
      major: String
    ): Student
    deleteStudent(id: ID!): Boolean!

    # Course Operations
    addCourse(
      title: String!
      code: String!
      credits: Int!
      instructor: String!
    ): Course!
    updateCourse(
      id: ID!
      title: String
      code: String
      credits: Int
      instructor: String
    ): Course
    deleteCourse(id: ID!): Boolean!

    # Enrollment Operations (Bonus)
    enrollStudent(studentId: ID!, courseId: ID!): Student
    unenrollStudent(studentId: ID!, courseId: ID!): Student
  }
`;

const resolvers = {
  Query: {
    getAllStudents: () => {
      return students;
    },

    getStudent: (_, { id }) => {
      return students.find((student) => student.id === id);
    },
    getAllCourses: () => {
      return courses;
    },

    getCourse: (_, { id }) => {
      return courses.find((course) => course.id === id);
    },

    searchStudentsByMajor: (_, { major }) => {
      return students.filter(
        (student) =>
          student.major &&
          student.major.toLowerCase().includes(major.toLowerCase())
      );
    },
  },

  Mutation: {
    addStudent: (_, { name, email, age, major }) => {
      const newStudent = {
        id: String(students.length + 1),
        name,
        email,
        age,
        major: major || null,
      };
      students.push(newStudent);
      enrollments[newStudent.id] = [];
      return newStudent;
    },

    updateStudent: (_, { id, name, email, age, major }) => {
      const studentIndex = students.findIndex((student) => student.id === id);
      if (studentIndex === -1) return null;

      const student = students[studentIndex];

      if (name !== undefined) student.name = name;
      if (email !== undefined) student.email = email;
      if (age !== undefined) student.age = age;
      if (major !== undefined) student.major = major;

      students[studentIndex] = student;
      return student;
    },

    deleteStudent: (_, { id }) => {
      const initialLength = students.length;
      students = students.filter((student) => student.id !== id);

      delete enrollments[id];

      return students.length < initialLength;
    },

    addCourse: (_, { title, code, credits, instructor }) => {
      const newCourse = {
        id: String(courses.length + 1),
        title,
        code,
        credits,
        instructor,
      };
      courses.push(newCourse);
      return newCourse;
    },

    updateCourse: (_, { id, title, code, credits, instructor }) => {
      const courseIndex = courses.findIndex((course) => course.id === id);
      if (courseIndex === -1) return null;

      const course = courses[courseIndex];

      if (title !== undefined) course.title = title;
      if (code !== undefined) course.code = code;
      if (credits !== undefined) course.credits = credits;
      if (instructor !== undefined) course.instructor = instructor;

      courses[courseIndex] = course;
      return course;
    },

    deleteCourse: (_, { id }) => {
      const initialLength = courses.length;
      courses = courses.filter((course) => course.id !== id);

      Object.keys(enrollments).forEach((studentId) => {
        enrollments[studentId] = enrollments[studentId].filter(
          (courseId) => courseId !== id
        );
      });

      return courses.length < initialLength;
    },

    enrollStudent: (_, { studentId, courseId }) => {
      const student = students.find((s) => s.id === studentId);
      const course = courses.find((c) => c.id === courseId);

      if (!student || !course) return null;

      if (!enrollments[studentId]) {
        enrollments[studentId] = [];
      }

      if (!enrollments[studentId].includes(courseId)) {
        enrollments[studentId].push(courseId);
      }

      return student;
    },

    unenrollStudent: (_, { studentId, courseId }) => {
      const student = students.find((s) => s.id === studentId);

      if (!student || !enrollments[studentId]) return null;

      enrollments[studentId] = enrollments[studentId].filter(
        (id) => id !== courseId
      );

      return student;
    },
  },

  Student: {
    courses: (parent) => {
      const studentCourseIds = enrollments[parent.id] || [];
      return courses.filter((course) => studentCourseIds.includes(course.id));
    },
  },

  Course: {
    students: (parent) => {
      const enrolledStudentIds = Object.keys(enrollments).filter((studentId) =>
        enrollments[studentId].includes(parent.id)
      );
      return students.filter((student) =>
        enrolledStudentIds.includes(student.id)
      );
    },
  },
};

async function start() {
  const app = express();
  const server = new ApolloServer({
    typeDefs: typeDefs,
    resolvers: resolvers,
  });

  await server.start();
  server.applyMiddleware({ app, path: "/graphql" });
  app.listen(5000, () => {
    console.log(" Server ready at http://localhost:5000/graphql");
    console.log(" Student Management System API");
  });
}
start();
