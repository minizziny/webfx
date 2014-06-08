package org.araqne.dom.api;

import java.util.List;

import org.araqne.dom.model.Program;
import org.araqne.msgbus.Session;

public interface ProgramFilter {
	List<Program> getAllowedPrograms(Session session, List<Program> programs);
}
