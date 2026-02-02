Are you a multistreamer who’s always asking your viewers for their opinion about stuff? Sure, most platforms have their own poll system, but wouldn’t it be way better if you had **one global poll** that works across all the platforms you stream to?

Introducing **rexbordz’s MultiPoll Widget**.

It’s a clean browser-source widget that lets you run polls right on your stream, pulling votes straight from **Twitch**, **YouTube**, **Kick**, and **TikTok** chat. You can set up 2–5 choices, and your viewers just vote by typing the number of their choice (1, 2, 3, 4, or 5). Simple and universal.

Starting a poll is just as easy. I built a very intuitive settings page where you can configure everything, and since it’s all browser-based, you can even add it as a custom dock inside OBS. That means whenever you wanna throw out a global poll to your entire audience, you can launch it instantly. All without leaving OBS!

<img width="809" height="313" alt="Multipoll sample image" src="https://github.com/user-attachments/assets/3f1e8417-f46d-46b4-af75-4a85c361ad02" />

---

## **🔌 Requirements**

<img src="https://github.com/user-attachments/assets/77ff6913-e6d7-4fe0-b9a0-bf66f5e8f745" style="height: 1em; vertical-align: middle;"> **Streamer.Bot (For Twitch, YouTube, and/or Kick)** <br>
If you need help setting this up, visit their [website](https://streamer.bot/).

<img src="https://github.com/user-attachments/assets/3ec8eac2-17d2-4a97-a066-e55c1e29d2c5" style="height: 1em; vertical-align: middle;"> **Tikfinity (For TikTok)** <br>
You need this to be able to listen to TikTok events. If you need help setting this up, you can check out my [Tikfinity Setup Guide](https://www.notion.so/Tikfinity-Setup-Guide-241088f4f93e8051b991c6ef4b659934?pvs=21).

---

## **🚀 Installation**

1. **Open Streamer.bot (For Twitch, YouTube or Kick)**
    - You need to have WebSocket Server enabled:
        
        <img width="998" height="693" alt="image" src="https://github.com/user-attachments/assets/e7635495-9b25-4276-8be1-154402a82298" />

        
2. **Open TikFinity (For TikTok)**
    - I believe TikFinity’s WebSocket Server is on by default so there’s nothing else that needs to be done except for having it opened with your TikTok account logged in.
3. Copy the link below and add **MultiPoll Widget** as a **Browser Source** to your streaming software of choice. 
    
    ```xml
    https://rexbordz.github.io/multi-poll-widget/
    ```
    <img width="1201" height="974" alt="image" src="https://github.com/user-attachments/assets/f58e8a21-b4a5-4106-80cd-a61b0e2b2406" />
  
  > [!NOTE]
  > <img src="https://github.com/user-attachments/assets/c427e0a9-05af-4fd3-b620-7e5158f81f8d" style="height: 1.5em; vertical-align: middle;"> **Patreon Supporter Exclusive** - **Paid** Patreon members can have access to the **PRO** version of this widget which enables you to add **up to 10 choices** to the poll. You can get the pro version link in my **[Discord server](https://discord.com)**. <br><br>
  > **[Click here to be a paid member](https://www.patreon.com)**
  
  > [!TIP]
  > I recommend setting the **height** to at least **370** (**740** for the pro version) to make sure there’s enough space for the poll. The width is stretchable so you can set it to whatever.

4. Add the **MultiPoll Widget Settings Page** as a **Custom Browser Dock** to your streaming software of choice. 
    
    ```xml
    https://rexbordz.github.io/multi-poll-widget/settings
    ```
    <img width="1052" height="623" alt="image" src="https://github.com/user-attachments/assets/bac659a5-fe9e-4db1-ab3f-0e555ca8bf3d" />
    
  > [!NOTE]
  > <img src="https://github.com/user-attachments/assets/c427e0a9-05af-4fd3-b620-7e5158f81f8d" style="height: 1.5em; vertical-align: middle;"> **Patreon Supporter Exclusive** - **Paid** Patreon members can have access to the **PRO** version of this widget which enables you to add **up to 10 choices** to the poll. You can get the pro version link in my **[Discord server](https://discord.com)**. <br><br>
  > **[Click here to be a paid member](https://www.patreon.com)**
    
5. Start a poll using the settings page. First two choices are required. When you’re ready, just click **`Start Poll`**.
    <p align="center">
      <img width="469" height="625" alt="image" src="https://github.com/user-attachments/assets/a7b557b1-6204-43cd-8bc0-d402d4ccdfcf" />
    </p>
   <img width="809" height="313" alt="image" src="https://github.com/user-attachments/assets/a1b73a02-39c1-463a-8647-7b8e1ed60ced" />
    
    <aside>
    ✅

  > [!TIP]
  > **SUCCESS!** You have successfully installed Multipoll.
        
---

## **➕ Optional Add-ons**

I added optional Streamer.Bot actions that add quality-of-life features that some may find very valuable: 

```xml
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
```

Just import the code above into your Streamer.bot.

<img width="565" height="152" alt="image" src="https://github.com/user-attachments/assets/75843d78-ae30-47d8-b56d-02cb37533357" />

1. **Button triggers** - the buttons that you find on the settings page have corresponding Streamer.bot actions that essentially do the same thing. Very helpful if you want to add a hotkey to the buttons or add them to your stream deck via the Streamer.bot plugin.
    - MultiPoll Widget • [Trigger] Clear
    - MultiPoll Widget • [Trigger] Start/End Poll
    - MultiPoll Widget • [Trigger] Toggle Poll
    
    <img width="840" height="643" alt="image" src="https://github.com/user-attachments/assets/b5b8fb03-a30f-4e3a-8142-8195009b687c" />

    <img width="857" height="264" alt="image" src="https://github.com/user-attachments/assets/801cb649-aad9-49f4-a05f-aeb796c719ef" />
    
    <img width="908" height="772" alt="image" src="https://github.com/user-attachments/assets/128a40dc-71f1-4249-9eca-a7a08870f3b1" />

    
2. **MultiPoll Widget • Bot Messages  -** When this is enabled, the widget automatically sends a bot message to all the platforms that it supports when a poll starts and ends. You can enable/disable the action or sub-actions inside it as you want.
    
    <img width="1190" height="640" alt="image" src="https://github.com/user-attachments/assets/df67149b-ac68-4115-87a6-e5d7eb88a0cb" />

---

## **⚙️ Custom Settings**

You can kind of customize the widget by adding these parameters at the end of the URL:

**Custom Streamer.bot Address:**

```xml
?address=[Insert custom address here]
```

**Custom Streamer.bot Port:**

```xml
?port=[Insert custom port here]
```

So with custom settings, your browser source link should look like this:

`widget-link.com?alignRight=false?address=127.0.0.2?port=8081`

---

## 💝 Donate

Your donations help me create better content and improve stream quality! If you'd like to support my work and see more of it, you can donate through any of the following:

---

## 📞 Support

For technical support or inquiries, please contact me through my Discord channel:

- <img src="https://github.com/user-attachments/assets/99e66009-11f1-4bcc-a06f-aa5c2f90524a" style="height: 1.5em;"> **[Discord Server](https://discord.gg/pJWEPzbdfa)**

    You can ask questions in the [🗨️❓│support forum](https://discord.com/channels/789352409473875988/1327979423835623464) or  [#❓│support channel](https://discord.com/channels/789352409473875988/800788710789742622)
    
- 🐞 **Bug Reports**
    
    Post any bug reports in the [#🐞│bug-reports channel](https://discord.com/channels/789352409473875988/1317386476501205044) in my discord page
