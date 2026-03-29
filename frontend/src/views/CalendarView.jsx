import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Calendar as CalIcon, MapPin, Clock, Send, Check, Loader2 } from 'lucide-react';

export default function CalendarView({ todoState }) {
  if (!todoState) return <div className="p-8 text-[#ff69b4]">Initializing State...</div>;

  const [messages, setMessages] = useState([
    { role: 'ai', content: "Hi! Ready to organize your day? Tell me the task, time, and location." }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [proposal, setProposal] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isParsing]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || isParsing) return;

    const currentInput = userInput;
    setMessages(prev => [...prev, { role: 'user', content: currentInput }]);
    setUserInput('');
    setIsParsing(true);

    try {
      // Hits the FastAPI backend on port 8000
      const res = await fetch('http://127.0.0.1:8000/parse-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: currentInput })
      });

      if (!res.ok) {
        const errorText = res.status === 503 ? "Agent is busy, try again." : "Connection error.";
        throw new Error(errorText);
      }

      const data = await res.json();

      if (data.task && data.time) {
        setProposal(data);
        setMessages(prev => [...prev, { role: 'ai', content: "I've prepared a draft for your calendar. Does this look right?" }]);
      } else {
        setMessages(prev => [...prev, { role: 'ai', content: "I couldn't quite catch the details. Could you specify the task and time again?" }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', content: err.message || "Sync error. Is the backend live?" }]);
    } finally {
      setIsParsing(false);
    }
  };

  const confirmTask = async () => {
    if (!proposal) return;
    try {
      const res = await fetch('http://127.0.0.1:8000/add-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: "2026-03-28", // Matches the seed date in database.py
          task: {
            name: proposal.task,
            location: proposal.location,
            time: proposal.time,
            category: "calendar",
            value: 1.0
          }
        })
      });

      if (res.ok) {
        // Adds the structured object to local state
        todoState.add(proposal.task, proposal.time, proposal.location);
        setProposal(null);
        setMessages(prev => [...prev, { role: 'ai', content: "Successfully added to your schedule and carbon tracker." }]);
      }
    } catch (err) {
      console.error("Confirmation failed:", err);
    }
  };

  return (
    <div className="pro-container calendar-layout-grid">
      {/* LEFT: CHATBOT SECTION */}
      <section className="calendar-half chat-zone">
        <header className="agent-header">
          <MessageSquare size={24} className="accent-icon mb-1" />
          <h2 className="agent-title">Scheduling Agent</h2>
        </header>

        <div className="content-card chat-card-compact">
          <div className="chat-flow custom-scrollbar">
            {messages.map((m, i) => (
              <div key={i} className={`msg-bubble ${m.role}`}>{m.content}</div>
            ))}
            {isParsing && (
              <div className="msg-bubble ai">
                <Loader2 className="animate-spin" size={14} />
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {proposal && (
            <div className="proposal-overlay animate-slide-up">
              <h4 className="proposal-confirm-title">Confirm New Entry</h4>
              <div className="proposal-data">
                <p><Check size={12} /> {proposal.task}</p>
                <p><Clock size={12} /> {proposal.time}</p>
                <p><MapPin size={12} /> {proposal.location || 'Not specified'}</p>
              </div>
              <div className="proposal-btns">
                <button onClick={confirmTask} className="btn-confirm-mini">Add Task</button>
                <button onClick={() => setProposal(null)} className="btn-cancel-mini">Cancel</button>
              </div>
            </div>
          )}

          <form className="todo-input-group mt-4" onSubmit={handleSendMessage}>
            <input
              className="todo-input"
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              placeholder="e.g. Yoga at 6pm in the Gym"
            />
            <button type="submit" className="btn-add-task" disabled={isParsing}>
              <Send size={18} />
            </button>
          </form>
        </div>
      </section>

      {/* RIGHT: TODAY'S CALENDAR */}
      <section className="calendar-half schedule-zone">
        <header className="agent-header">
          <CalIcon size={24} className="accent-icon mb-1" />
          <h2 className="agent-title">Today's Calendar</h2>
        </header>
        <div className="content-card schedule-card">
          <div className="schedule-list custom-scrollbar">
            {todoState.todos.length === 0 ? (
              <p className="empty-msg">No tasks scheduled for today.</p>
            ) : (
              todoState.todos.map((t) => (
                <div key={t.id} className="schedule-item-pro">
                  <div className="item-accent" />
                  <div className="item-content-wrapper">
                    <div className="item-main-row">
                      <span className={`item-name ${t.done ? 'text-strike' : ''}`}>
                        {t.text}
                      </span>
                    </div>

                    {/* SENIOR FIX: Render using the direct properties from the hook */}
                    {(t.time || t.location) && (
                      <div className="item-meta-row">
                        {t.time && (
                          <span className="meta-tag">
                            <Clock size={12} /> {t.time}
                          </span>
                        )}
                        {t.location && (
                          <span className="meta-tag">
                            <MapPin size={12} /> {t.location}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}