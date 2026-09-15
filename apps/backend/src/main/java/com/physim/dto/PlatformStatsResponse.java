package com.physim.dto;

public class PlatformStatsResponse {

    private UserStats users;
    private ExperimentStats experiments;
    private AcademicStats academics;

    public PlatformStatsResponse() {
    }

    public PlatformStatsResponse(UserStats users, ExperimentStats experiments, AcademicStats academics) {
        this.users = users;
        this.experiments = experiments;
        this.academics = academics;
    }

    public UserStats getUsers() {
        return users;
    }

    public void setUsers(UserStats users) {
        this.users = users;
    }

    public ExperimentStats getExperiments() {
        return experiments;
    }

    public void setExperiments(ExperimentStats experiments) {
        this.experiments = experiments;
    }

    public AcademicStats getAcademics() {
        return academics;
    }

    public void setAcademics(AcademicStats academics) {
        this.academics = academics;
    }

    public static class UserStats {
        private long total;
        private long students;
        private long teachers;
        private long admins;

        public UserStats() {
        }

        public UserStats(long total, long students, long teachers, long admins) {
            this.total = total;
            this.students = students;
            this.teachers = teachers;
            this.admins = admins;
        }

        public long getTotal() {
            return total;
        }

        public void setTotal(long total) {
            this.total = total;
        }

        public long getStudents() {
            return students;
        }

        public void setStudents(long students) {
            this.students = students;
        }

        public long getTeachers() {
            return teachers;
        }

        public void setTeachers(long teachers) {
            this.teachers = teachers;
        }

        public long getAdmins() {
            return admins;
        }

        public void setAdmins(long admins) {
            this.admins = admins;
        }
    }

    public static class ExperimentStats {
        private long totalSaved;
        private long activeShares;

        public ExperimentStats() {
        }

        public ExperimentStats(long totalSaved, long activeShares) {
            this.totalSaved = totalSaved;
            this.activeShares = activeShares;
        }

        public long getTotalSaved() {
            return totalSaved;
        }

        public void setTotalSaved(long totalSaved) {
            this.totalSaved = totalSaved;
        }

        public long getActiveShares() {
            return activeShares;
        }

        public void setActiveShares(long activeShares) {
            this.activeShares = activeShares;
        }
    }

    public static class AcademicStats {
        private long classrooms;
        private long submissions;

        public AcademicStats() {
        }

        public AcademicStats(long classrooms, long submissions) {
            this.classrooms = classrooms;
            this.submissions = submissions;
        }

        public long getClassrooms() {
            return classrooms;
        }

        public void setClassrooms(long classrooms) {
            this.classrooms = classrooms;
        }

        public long getSubmissions() {
            return submissions;
        }

        public void setSubmissions(long submissions) {
            this.submissions = submissions;
        }
    }
}
